# Node Contracts (pm_demand_closure_v1)

## 1) input_parse

Input:
- `raw_request: string`
- `business_background: string`
- `current_state: string`
- `target_metrics: string[]`

Output:
- `normalized_input: object`
- `missing_fields: string[]`
- `route_flags: object`

## 2) clarify_requirement

Input:
- `normalized_input: object`
- `missing_fields: string[]`

Output:
- `requirement_brief: object`
- `clarification_notes: string`
- `is_ready_for_prd: boolean`

## 3) generate_prd

Input:
- `requirement_brief: object`

Output:
- `prd_draft: string`

## 4) generate_plan

Input:
- `requirement_brief: object`
- `prd_draft: string`

Output:
- `implementation_plan: string`

## 5) design_ab_test

Input:
- `requirement_brief: object`
- `target_metrics: string[]`

Output:
- `experiment_spec: string`

## 6) design_tracking

Input:
- `requirement_brief: object`
- `experiment_spec: string`

Output:
- `tracking_spec: string`
- `ux_compliance: string`

## 7) bundle_output

Input:
- `clarification_notes: string`
- `prd_draft: string`
- `implementation_plan: string`
- `experiment_spec: string`
- `tracking_spec: string`
- `ux_compliance: string`

Output:
- `delivery_bundle: object`
- `demo_summary: string`

