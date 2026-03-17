## Plan: HRMS Module Migration to vowerp3ui + vowerp3be

Migrate the HRMS module from legacy vow-ui-2.0 (React 17 + Redux) to vowerp3ui (Next.js 15) and vowerp3be (FastAPI). Phase 1 covers **Employee Database** (7-step wizard) and **Pay Scheme** (Parameters + Creation). This requires building two new shared UI components (Stepper, FileUpload), creating backend endpoints using existing ORM models, and implementing 4 new page groups.

---

### Phase 0: Shared UI Infrastructure (PREREQUISITE — blocks all other phases)

1. **Build shared `Stepper` component** → `src/components/ui/stepper.tsx` — horizontal step indicator with completed/active/disabled/error states, click navigation between completed steps. Props: `steps[]`, `activeStep`, `onStepClick`, `completedSteps`. Add Storybook story + tests.

2. **Build shared `FileUpload` component** → `src/components/ui/fileUpload.tsx` — drag-and-drop + click-to-browse, upload/delete handlers, existing files display, file type/size validation. Add Storybook story + tests.

3. **Define HRMS API routes** → extend `src/utils/api.ts` with ~17 HRMS endpoints covering employee CRUD, per-section save, file management, pay scheme CRUD, and pay param CRUD.

4. **Create HRMS service layer** → `src/utils/hrmsService.ts` with ~17 functions wrapping `fetchWithCookie` calls for all employee and pay scheme operations.

---

### Phase 1: Backend — HRMS Endpoints (vowerp3be) *parallel with Phase 2*

5. **Create module structure**: `src/hrms/employee.py`, `payScheme.py`, `payParam.py`, `query.py`, `schemas.py`, `constants.py`
6. **Pydantic schemas** (`schemas.py`): Request/response models for all endpoints — `EmployeeListResponse`, `EmployeeDetailResponse`, `EmployeeCreateSetupResponse`, per-section payloads, `PaySchemeCreatePayload`, etc.
7. **SQL queries** (`query.py`): Employee list (joined with official details for dept/designation), employee by ID (join all HRMS tables), create setup (query master tables for dropdown options), progress check (which child tables have data)
8. **Employee endpoints** (`employee.py`): 7 endpoints — list, by_id, create_setup, create, section_save (upsert per-section), progress, file management. Uses `Depends(get_tenant_db)` + auth. *ORM models already exist in* `src/models/hrms.py`
9. **Pay scheme endpoints** (`payScheme.py`): List, by_id, create_setup, create, update
10. **Pay param endpoints** (`payParam.py`): List, create_setup, create, update
11. **Register routers** in `src/main.py` under `/api/hrms` prefix
12. **Backend tests**: `test_hrms_employee.py` + `test_hrms_pay_scheme.py` (mock DB, test validation, error cases)

---

### Phase 2: Frontend — Employee Database Module *parallel with Phase 1*

13. **Types** (`employeeTypes.ts`): `PersonalDetailsForm`, `ContactDetailsForm`, `AddressDetailsForm`, `EducationEntry`, `ExperienceEntry`, `OfficialDetailsForm`, `BankDetailsForm`, `PfDetailsForm`, `EsiDetailsForm`, `EmployeeSetupOptions`, `EmployeeStepDef`
14. **Constants** (`employeeConstants.ts`): 7-step definitions, status IDs (standard 21/1/20/3/4/6), frozen empty arrays
15. **Factories** (`employeeFactories.ts`): Default builders per section (e.g., `buildDefaultPersonalDetails()`, `createBlankEducationRow()`)
16. **Mappers + tests** (`employeeMappers.ts`): API → form value converters per section with null safety
17. **Hooks**:
    - `useEmployeeSteps` — wizard navigation (active step, completed set, sequential unlock)
    - `useEmployeeFormState` — multi-section form state with dirty tracking
    - `useEmployeeSetup` — wraps `useTransactionSetup` for dropdown options
    - `useEmployeeValidation` — Zod schemas per step (name required, email format, aadhar 12 digits, UAN 12 digits, ESI/medical mutual exclusivity, DOJ validations)
    - `useEmployeeProgress` — fetch/update wizard completion status
18. **Employee list page** (`employees/page.tsx`): `IndexWrapper` with columns (EB Code, Name, Dept, Designation, Status, DOJ), pagination, search, create/edit/view actions. *Pattern reference:* `masters/itemMaster/page.tsx`
19. **Wizard orchestrator** (`createEmployee/page.tsx`): Extract mode/id from URL, render `TransactionWrapper` + `Stepper` + active step component. Each step: `MuiForm` → "Save & Continue" → calls `saveEmployeeSection` API → `completeStep`
20. **15 step components** (`_components/`): PersonalDetails, Contact, Address, Education (dynamic table + file upload), Experience (dynamic table + file upload), OfficialInfo, Bank, SalaryStructure, ShiftTiming, LeavePolicy, PF, ESI, UploadDocuments, GenerateLetters, Onboarding
21. **Frontend tests**: Hook tests (steps, form state, validation schemas), mapper tests, component tests (render, view mode disabled)

---

### Phase 3: Frontend — Pay Scheme Module

22. **Pay scheme types, constants, factories, mappers** — `PaySchemeForm`, `PayComponent` with 4 categories (Input/Earning/Deduction/Summary)
23. **Pay scheme list page** — `IndexWrapper` (Code, Name, Wage Type, Status)
24. **Pay scheme create/edit page** — Header `MuiForm` (code, name, wage type, designation, location, copy-from) + 4-section component grid using `TransactionLineItems` for editable component rows
25. **Pay scheme parameters** pages — list + create/edit (simpler forms)
26. **Pay scheme tests** — validation, mappers, list rendering

---

### Phase 4: Database Verification

27. **Verify HRMS tables** exist in tenant DB (10 tables matching `src/models/hrms.py`) *depends on steps 5-8*
28. **Verify/create pay scheme tables** — `pay_scheme_mst`, `pay_scheme_dtl`, `pay_component_mst`; write migration SQL if missing
29. **Verify file upload tables** — check storage pattern for employee documents

---

### Relevant Files

**Backend (vowerp3be)**
- `src/models/hrms.py` — 12 ORM models (authoritative schema, `HrmsEdPersonalDetails`, `HrmsEdOfficialDetails`, `HrmsEdBankDetails`, etc.)
- `src/config/db.py` — `get_tenant_db` for Portal persona
- `src/main.py` — Add router registrations
- `src/procurement/indent.py` — Reference endpoint pattern

**Frontend (vowerp3ui)**
- `src/components/ui/IndexWrapper.tsx` — Reuse for list pages
- `src/components/ui/TransactionWrapper.tsx` — Reuse for wizard page chrome
- `src/components/ui/muiform.tsx` — Reuse for each step's form
- `src/components/ui/transaction/useLineItems.ts` — Reuse for education/experience dynamic tables
- `src/components/ui/transaction/useDeferredOptionCache.ts` — Reuse for country→state cascading
- `src/components/ui/transaction/useTransactionSetup.ts` — Reuse for setup data fetch
- `src/utils/apiClient2.ts` — `fetchWithCookie` for all API calls
- `src/utils/api.ts` — Add HRMS routes

**Legacy Reference (READ ONLY)**
- `vow-ui-2.0/src/Pages/HR_Management/EmployeeDatabase/AddEmployees/index.js` — 7-step wizard orchestrator
- `vow-ui-2.0/src/Pages/HR_Management/EmployeeDatabase/AddEmployees/Makepayload.js` — 130+ field payload shape
- `vow-ui-2.0/src/Pages/HR_Management/PaySchemeCreation/` — Pay scheme CRUD with 4 component categories

---

### Verification

1. `pnpm storybook` → Stepper and FileUpload stories render all states
2. `pytest src/test/test_hrms_employee.py -v` → all backend tests pass
3. `npx tsc --noEmit` → no TypeScript errors in new files
4. `pnpm vitest src/app/dashboardportal/hrms` → all frontend tests pass
5. Navigate `/dashboardportal/hrms/employees` → paginated list with search
6. Create employee → complete all 7 wizard steps → record appears in list
7. Edit employee → all sections pre-populate, editable
8. View employee → all fields disabled
9. Pay scheme list + create with 4-category components → saves correctly
10. Full E2E smoke test: create employee through all steps

---

### Decisions

- **Per-step save**: Each wizard step saves independently (not all-at-once), matching legacy behavior
- **Sequential unlock**: Step N+1 only available after step N saved
- **Shared components**: Stepper and FileUpload are generic, reusable by future modules
- **Scope**: Employee Database + Pay Scheme only. Leave, Attendance, Advance, Expense, PayRoll, PayRegister, PaySlip deferred to Phase 2+
- **Client Visit Plan**: Excluded (was a stub in legacy)
- **ORM models exist**: Tables assumed present in tenant DB

### Further Considerations

1. **Pay scheme tables** — Need to verify `pay_scheme_mst` and `pay_component_mst` exist in tenant DB. If missing, migration scripts are needed before pay scheme implementation.
2. **Shift & biometric tables** — Step 6 (Shift & Leave Policy) references `spell_master`, `biometric_device_mst` tables. Need verification before implementing that wizard step.
3. **Menu registration** — New HRMS pages must be added to `portal_menu_mst` (vowconsole3) and `menu_mst` (tenant DB) with `role_menu_map` entries for sidebar visibility.
