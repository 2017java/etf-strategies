from __future__ import annotations

import shutil
from pathlib import Path
from typing import Any, Callable

from ..errors import TaskError, ValidationTaskError
from .excel_utils import detect_non_empty_bounds
from .word_utils import find_paragraph_index_by_anchor, find_paragraph_index_by_page

try:
    import pythoncom
    import win32com.client as win32
except ImportError:  # pragma: no cover
    pythoncom = None
    win32 = None


LogFn = Callable[[str, str], None]


class OfficeComService:
    def process(self, payload: dict[str, Any], input_dir: Path, log_fn: LogFn, task_id: str) -> Path:
        if win32 is None or pythoncom is None:
            raise TaskError("缺少 pywin32 或当前环境无法使用 COM 自动化")

        excel_path = Path(payload["excel_path"])
        word_path = Path(payload["word_path"])
        mappings: list[dict[str, Any]] = payload["mappings"]

        normalized_excel = self._normalize_excel(excel_path, log_fn, task_id)
        normalized_word = self._normalize_word(word_path, log_fn, task_id)

        result_path = input_dir / "result.docx"
        shutil.copy2(normalized_word, result_path)

        pythoncom.CoInitialize()
        excel_app = None
        word_app = None
        workbook = None
        document = None

        try:
            excel_app = win32.DispatchEx("Excel.Application")
            excel_app.Visible = False
            excel_app.DisplayAlerts = False
            workbook = excel_app.Workbooks.Open(str(normalized_excel))

            word_app = win32.DispatchEx("Word.Application")
            word_app.Visible = False
            word_app.DisplayAlerts = 0
            document = word_app.Documents.Open(str(result_path))

            for index, rule in enumerate(mappings, start=1):
                log_fn(task_id, f"执行第 {index} 条规则: Sheet={rule['sheet_name']}")
                self._apply_one_rule(workbook, document, rule, log_fn, task_id)
                log_fn(task_id, f"第 {index} 条规则执行完成")

            document.SaveAs2(str(result_path), FileFormat=16)
            return result_path
        finally:
            if document is not None:
                document.Close(SaveChanges=False)
            if workbook is not None:
                workbook.Close(SaveChanges=False)
            if word_app is not None:
                word_app.Quit()
            if excel_app is not None:
                excel_app.Quit()
            pythoncom.CoUninitialize()

    def preview_sheet_range(self, excel_path: Path, sheet_name: str) -> dict[str, str | None]:
        if win32 is None or pythoncom is None:
            raise TaskError("缺少 pywin32 或当前环境无法使用 COM 自动化")

        normalized_excel = self._normalize_excel(excel_path, lambda *_: None, "preview")

        pythoncom.CoInitialize()
        excel_app = None
        workbook = None

        try:
            excel_app = win32.DispatchEx("Excel.Application")
            excel_app.Visible = False
            excel_app.DisplayAlerts = False
            workbook = excel_app.Workbooks.Open(str(normalized_excel))
            sheet = self._get_sheet(workbook, sheet_name)
            detected = self._detect_range(sheet)
            used_range = self._get_range_address(sheet.UsedRange)
            return {"sheet_name": sheet_name, "detected_range": detected, "used_range": used_range}
        finally:
            if workbook is not None:
                workbook.Close(SaveChanges=False)
            if excel_app is not None:
                excel_app.Quit()
            pythoncom.CoUninitialize()

    def _apply_one_rule(
        self,
        workbook: Any,
        document: Any,
        rule: dict[str, Any],
        log_fn: LogFn,
        task_id: str,
    ) -> None:
        sheet = self._get_sheet(workbook, rule["sheet_name"])
        range_address = (rule.get("range_address") or "").strip().upper()

        if rule.get("auto_detect", True) or not range_address:
            range_address = self._detect_range(sheet) or ""
            log_fn(task_id, f"自动识别范围: {range_address or '空'}")

        if not range_address:
            raise ValidationTaskError(f"Sheet '{rule['sheet_name']}' 未识别到可复制的表格区域")

        source_range = sheet.Range(range_address)
        log_fn(task_id, "已获取 Excel 源区域")
        target_range, strategy = self._locate_word_range(
            document=document,
            page=rule["target_page"],
            paragraph=rule["target_paragraph"],
            anchor_keyword=rule.get("anchor_keyword"),
            anchor_offset=int(rule.get("anchor_offset") or 0),
        )
        log_fn(task_id, f"定位策略: {strategy}")

        existing_tables = document.Tables.Count
        source_range.Copy()
        log_fn(task_id, "已复制 Excel 区域到剪贴板")
        target_range.Collapse(1)
        target_range.PasteExcelTable(False, False, False)
        log_fn(task_id, "已执行粘贴")

        if document.Tables.Count <= existing_tables:
            raise TaskError("粘贴失败，未在 Word 中生成表格")

        inserted_table = self._get_com_item(document.Tables, document.Tables.Count)
        self._sync_dimensions(source_range, inserted_table)

    def _get_sheet(self, workbook: Any, sheet_name: str) -> Any:
        try:
            return workbook.Worksheets(sheet_name)
        except Exception as exc:  # noqa: BLE001
            raise ValidationTaskError(f"找不到 Sheet: {sheet_name}") from exc

    def _detect_range(self, sheet: Any) -> str | None:
        used_range = sheet.UsedRange
        values = used_range.Value

        if values is None:
            return None

        matrix = self._to_matrix(values)
        bounds = detect_non_empty_bounds(matrix)
        if bounds is None:
            return None

        min_row, min_col, max_row, max_col = bounds
        start_row = used_range.Row + min_row - 1
        start_col = used_range.Column + min_col - 1
        end_row = used_range.Row + max_row - 1
        end_col = used_range.Column + max_col - 1

        excel_range = sheet.Range(sheet.Cells(start_row, start_col), sheet.Cells(end_row, end_col))
        return self._get_range_address(excel_range)

    def _locate_word_range(
        self,
        document: Any,
        page: int,
        paragraph: int,
        anchor_keyword: str | None,
        anchor_offset: int,
    ) -> tuple[Any, str]:
        paragraphs = document.Paragraphs
        page_numbers: list[int] = []
        paragraphs_text: list[str] = []

        for idx in range(1, paragraphs.Count + 1):
            paragraph_item = self._get_com_item(paragraphs, idx)
            rng = paragraph_item.Range
            page_no = int(self._get_range_page_number(rng))
            page_numbers.append(page_no)
            paragraphs_text.append(self._normalize_paragraph_text(rng.Text))

        try:
            target_index = find_paragraph_index_by_page(page_numbers, page, paragraph)
            return self._get_com_item(paragraphs, target_index + 1).Range, "page+paragraph"
        except ValueError as exc:
            if not anchor_keyword:
                raise ValidationTaskError(str(exc)) from exc

        try:
            target_index = find_paragraph_index_by_anchor(
                paragraphs_text=paragraphs_text,
                page_numbers=page_numbers,
                anchor_keyword=anchor_keyword,
                preferred_page=page,
                anchor_offset=anchor_offset,
            )
            return self._get_com_item(paragraphs, target_index + 1).Range, "anchor_fallback"
        except ValueError as exc:
            raise ValidationTaskError(str(exc)) from exc

    def _sync_dimensions(self, source_range: Any, table: Any) -> None:
        col_count = min(int(source_range.Columns.Count), int(table.Columns.Count))
        row_count = min(int(source_range.Rows.Count), int(table.Rows.Count))

        for col_idx in range(1, col_count + 1):
            try:
                table.Columns(col_idx).Width = float(source_range.Columns(col_idx).Width)
            except Exception:
                continue

        for row_idx in range(1, row_count + 1):
            try:
                row_height = float(source_range.Rows(row_idx).RowHeight)
                if row_height > 0:
                    table.Rows(row_idx).HeightRule = 2
                    table.Rows(row_idx).Height = row_height
            except Exception:
                continue

    def _normalize_excel(self, excel_path: Path, log_fn: LogFn, task_id: str) -> Path:
        suffix = excel_path.suffix.lower()
        if suffix == ".xlsx":
            return excel_path
        if suffix != ".xls":
            raise ValidationTaskError("Excel 文件仅支持 .xls 或 .xlsx")

        converted = excel_path.with_suffix(".xlsx")
        log_fn(task_id, "检测到 .xls，开始转换为 .xlsx")

        pythoncom.CoInitialize()
        excel_app = None
        workbook = None
        try:
            excel_app = win32.DispatchEx("Excel.Application")
            excel_app.Visible = False
            excel_app.DisplayAlerts = False
            workbook = excel_app.Workbooks.Open(str(excel_path))
            workbook.SaveAs(str(converted), FileFormat=51)
        finally:
            if workbook is not None:
                workbook.Close(SaveChanges=False)
            if excel_app is not None:
                excel_app.Quit()
            pythoncom.CoUninitialize()

        return converted

    def _normalize_word(self, word_path: Path, log_fn: LogFn, task_id: str) -> Path:
        suffix = word_path.suffix.lower()
        if suffix == ".docx":
            return word_path
        if suffix != ".doc":
            raise ValidationTaskError("Word 文件仅支持 .doc 或 .docx")

        converted = word_path.with_suffix(".docx")
        log_fn(task_id, "检测到 .doc，开始转换为 .docx")

        pythoncom.CoInitialize()
        word_app = None
        document = None
        try:
            word_app = win32.DispatchEx("Word.Application")
            word_app.Visible = False
            word_app.DisplayAlerts = 0
            document = word_app.Documents.Open(str(word_path))
            document.SaveAs2(str(converted), FileFormat=16)
        finally:
            if document is not None:
                document.Close(SaveChanges=False)
            if word_app is not None:
                word_app.Quit()
            pythoncom.CoUninitialize()

        return converted

    def _to_matrix(self, values: Any) -> list[list[Any]]:
        if isinstance(values, tuple):
            if values and isinstance(values[0], tuple):
                return [list(row) for row in values]
            return [list(values)]
        return [[values]]

    def _normalize_paragraph_text(self, text: str) -> str:
        return text.replace("\r", "").replace("\x07", "").strip()

    def _get_range_address(self, range_obj: Any) -> str:
        address_member = range_obj.Address
        if callable(address_member):
            return str(address_member(False, False)).replace("$", "")
        return str(address_member).replace("$", "")

    def _get_com_item(self, collection: Any, index: int) -> Any:
        """Prefer .Item(index) for COM collections and fallback to callable form."""
        try:
            return collection.Item(index)
        except Exception:
            return collection(index)

    def _get_range_page_number(self, rng: Any) -> int:
        """
        Resolve page number with compatibility across Word versions.
        3 -> wdActiveEndPageNumber, 1 kept as fallback for older behavior.
        """
        try:
            return int(rng.Information(3))
        except Exception:
            return int(rng.Information(1))
