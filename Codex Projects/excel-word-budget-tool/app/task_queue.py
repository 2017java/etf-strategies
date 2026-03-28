from __future__ import annotations

import traceback
from queue import Queue
from threading import Thread

from .errors import TaskError
from .models import TaskRecord, TaskStatus
from .services.office_com import OfficeComService
from .storage import TaskStore


class SerialTaskQueue:
    def __init__(self, store: TaskStore, service: OfficeComService) -> None:
        self._queue: Queue[str] = Queue()
        self._store = store
        self._service = service
        self._worker = Thread(target=self._run, daemon=True)
        self._worker.start()

    def submit(self, task: TaskRecord) -> None:
        self._store.add_log(task.task_id, "任务已入队，等待执行")
        self._queue.put(task.task_id)

    def _run(self) -> None:
        while True:
            task_id = self._queue.get()
            task = self._store.get(task_id)
            if task is None:
                self._queue.task_done()
                continue

            self._store.update_status(task_id, TaskStatus.RUNNING)
            self._store.add_log(task_id, "开始执行 Office 自动化任务")

            try:
                result_path = self._service.process(task.payload, task.input_dir, self._store.add_log, task_id)
                self._store.set_result(task_id, result_path)
                self._store.update_status(task_id, TaskStatus.SUCCESS)
                self._store.add_log(task_id, "任务完成")
            except TaskError as exc:
                self._store.update_status(task_id, TaskStatus.FAILED)
                self._store.set_error(task_id, "TASK_ERROR", str(exc))
                self._store.add_log(task_id, f"任务失败: {exc}")
            except Exception as exc:  # noqa: BLE001
                self._store.update_status(task_id, TaskStatus.FAILED)
                self._store.set_error(task_id, "INTERNAL_ERROR", str(exc))
                self._store.add_log(task_id, f"系统异常: {exc}")
                self._store.add_log(task_id, traceback.format_exc())
            finally:
                self._queue.task_done()
