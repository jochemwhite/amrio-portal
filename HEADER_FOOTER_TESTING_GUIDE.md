# Header & Footer CMS - Testing Guide

This guide provides comprehensive testing instructions for the new Header & Footer management system.

## Prerequisites

Before testing, ensure:
1. Database migrations have been applied (`supabase/migrations/20240101_create_layout_tables.sql` and `20240102_create_get_page_layout_rpc.sql`)
2. Supabase types have been regenerated
3. Development server is running
4. You have at least one website and one page created

## Setup Steps

### 1. Apply Database Migrations

```bash
# Connect to your Supabase project and run the migrations
# via Supabase CLI or Dashboard SQL Editor
```

Run the following SQL files in order:
- `supabase/migrations/20240101_create_layout_tables.sql`
- `supabase/migrations/20240102_create_get_page_layout_rpc.sql`

### 2. Regenerate Supabase Types

```bash
# If using Supabase CLI
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
```

## Testing Workflow

### Phase 1: Template Creation

#### Test 1.1: Navigate to Headers & Footers
1. Select a website from the website switcher
2. Verify "Headers & Footers" appears in the sidebar
3. Click "Headers & Footers"
4. Verify you land on `/dashboard/websites/[websiteId]/layouts`
5. Verify tabs showing "Headers" and "Footers" are displayed

**Expected Result:** Layout templates page loads with two tabs, initially showing empty states.

#### Test 1.2: Create Header Template
1. Click on "Headers" tab
2. Click "Create Header" button
3. Fill in the form:
   - Name: "Main Header"
   - Description: "Primary website header"
   - Check "Set as default"
4. Click "Create Template"
5. Verify success toast appears
6. Verify redirect to schema builder
7. Verify new template appears in the headers list

**Expected Result:** Header template created successfully and listed with "Default" badge.

#### Test 1.3: Create Footer Template
1. Switch to "Footers" tab
2. Click "Create Footer" button
3. Fill in the form:
   - Name: "Main Footer"
   - Description: "Primary website footer"
   - Check "Set as default"
4. Click "Create Template"
5. Verify success toast appears

**Expected Result:** Footer template created and set as default.

### Phase 2: Schema Building

#### Test 2.1: Design Header Schema
1. From header template card, click "Schema" button
2. Click "Add Section"
3. Create a section named "Header Content"
4. Add fields to the section:
   - **Field 1:** Logo (type: image)
   - **Field 2:** Navigation Menu (type: navigation_menu)
   - **Field 3:** CTA Text (type: text)
5. Click "Save Changes"
6. Verify pending changes counter updates
7. Verify success toast on save

**Expected Result:** Schema saved with all fields properly structured.

#### Test 2.2: Design Footer Schema
1. Navigate to footer template's schema builder
2. Add section "Footer Content"
3. Add fields:
   - **Field 1:** Copyright Text (type: text)
   - **Field 2:** Social Links (type: navigation_menu)
   - **Field 3:** Footer Links (type: navigation_menu)
4. Save changes

**Expected Result:** Footer schema saved successfully.

### Phase 3: Content Editing

#### Test 3.1: Edit Header Content
1. Navigate to header template
2. Click "Content" button
3. Fill in the fields:
   - Logo: Upload an image
   - Navigation Menu: Add menu items (test hierarchy with sub-items)
   - CTA Text: "Get Started"
4. Click "Save Changes"
5. Verify "Unsaved changes" badge appears before saving
6. Verify success toast after saving

**Expected Result:** Content saved and badge clears.

#### Test 3.2: Test Navigation Menu Builder
1. In the Navigation Menu field, add multiple items:
   - Home (internal link)
   - About (with 2 sub-items)
   - Services (dropdown with 3 sub-items)
   - Contact (external link)
2. Test drag-and-drop reordering
3. Test nesting items under parents
4. Test editing individual menu items
5. Save and verify structure persists

**Expected Result:** Menu structure is maintained with proper hierarchy.

#### Test 3.3: Edit Footer Content
1. Navigate to footer template content editor
2. Fill in copyright text
3. Add social media links to navigation menu
4. Add footer links
5. Save changes

**Expected Result:** Footer content saved successfully.

### Phase 4: Assignment Rules

#### Test 4.1: Create "All Pages" Assignment
1. Navigate to header template
2. Click dropdown menu → "Manage Assignments"
3. Click "Add Assignment"
4. Select "All Pages" condition type
5. Set priority to 10
6. Click "Create Assignment"
7. Verify assignment appears in list

**Expected Result:** Assignment created with "Applied to all pages" description.

#### Test 4.2: Create "Specific Pages" Assignment
1. Create a second header template "Special Header"
2. Navigate to its assignments
3. Click "Add Assignment"
4. Select "Specific Pages"
5. Check 2-3 specific pages
6. Set priority to 20 (higher than previous)
7. Create assignment

**Expected Result:** Assignment shows selected page count and names.

#### Test 4.3: Create "URL Pattern" Assignment
1. Create footer template "Blog Footer"
2. Add assignment with type "URL Pattern"
3. Enter pattern: `^/blog/.*`
4. Set priority to 15
5. Create assignment

**Expected Result:** Assignment created with pattern description.

#### Test 4.4: Test Priority Ordering
1. View all assignments for a template
2. Verify they're sorted by priority (highest first)
3. Edit an assignment to change priority
4. Verify list reorders automatically

**Expected Result:** Assignments display in correct priority order.

### Phase 5: Page-Level Overrides

#### Test 5.1: Apply Page Override
1. Navigate to any page: `/dashboard/pages/[pageId]`
2. Navigate to layout settings (new route): `/dashboard/pages/[pageId]/layout-settings`
3. Verify current defaults are shown
4. Select a different header template from dropdown
5. Select a different footer template
6. Click "Save Changes"
7. Verify success toast

**Expected Result:** Overrides saved for this specific page.

#### Test 5.2: Clear Page Override
1. On the same page's layout settings
2. Click "Clear All Overrides" button
3. Confirm action
4. Verify templates revert to "Use Default"
5. Verify save button is disabled (no changes)

**Expected Result:** Overrides cleared, page will use default/assignment rules.

#### Test 5.3: Partial Override
1. Set only header override (leave footer as default)
2. Save changes
3. Verify only header field is populated
4. Verify footer shows as "Use Default"

**Expected Result:** Partial overrides work correctly.

### Phase 6: Resolution Logic

#### Test 6.1: Test Default Template Resolution
1. Create a page with no specific assignment or override
2. Call the RPC function manually or check via API:
   ```sql
   SELECT get_page_layout('page-uuid-here');
   ```
3. Verify it returns the default header and footer

**Expected Result:** Returns default templates with full content.

#### Test 6.2: Test Assignment Rule Resolution
1. Create page matching a specific assignment (e.g., in /blog/)
2. Query layout for this page
3. Verify it returns the assigned template (not default)

**Expected Result:** Assignment rule takes precedence over default.

#### Test 6.3: Test Page Override Resolution
1. Set page-level override for a page
2. Query layout for this page
3. Verify it returns overridden template

**Expected Result:** Page override takes highest precedence.

#### Test 6.4: Test Priority Order
Create this scenario:
- Default header: "Main Header"
- Assignment (priority 10): "All Pages Header"
- Assignment (priority 20): "Special Pages Header" (specific pages)
- Page override: "Custom Header"

Test a page that matches all conditions:
1. Remove page override → should use priority 20 assignment
2. Remove priority 20 assignment → should use priority 10 assignment
3. Remove all assignments → should use default

**Expected Result:** Resolution follows correct priority order.

### Phase 7: Update Operations

#### Test 7.1: Update Template Metadata
1. Open template card dropdown
2. Update template name and description
3. Toggle "Set as Default"
4. Verify changes save
5. Verify UI updates immediately

**Expected Result:** Metadata updates reflected immediately.

#### Test 7.2: Modify Schema Structure
1. Edit header schema
2. Add new field
3. Save
4. Navigate to content editor
5. Verify new field appears
6. Fill in new field and save

**Expected Result:** Schema changes reflected in content editor.

#### Test 7.3: Update Content
1. Edit existing header content
2. Change multiple fields
3. Save
4. Refresh page
5. Verify changes persisted

**Expected Result:** Content updates saved correctly.

### Phase 8: Delete Operations

#### Test 8.1: Delete Assignment
1. Navigate to template assignments
2. Click delete on an assignment
3. Confirm deletion
4. Verify assignment removed from list

**Expected Result:** Assignment deleted without affecting template.

#### Test 8.2: Delete Template (with safeguards)
1. Try to delete a template that has assignments
2. Verify assignments are also deleted (cascade)
3. Try to delete the default template
4. Verify successful deletion

**Expected Result:** Template and related data deleted properly.

### Phase 9: Edge Cases

#### Test 9.1: No Templates Exist
1. Delete all header templates
2. Query page layout
3. Verify header field returns null
4. Verify page still functions

**Expected Result:** System handles missing templates gracefully.

#### Test 9.2: Multiple Default Templates (shouldn't happen)
1. Try to set two templates as default
2. Verify database constraint or application logic prevents this
3. Verify only one template remains as default

**Expected Result:** Only one default per type per website enforced.

#### Test 9.3: Invalid Page ID in Override
1. Try to set override for non-existent page
2. Verify appropriate error handling

**Expected Result:** Error message displayed, no database corruption.

#### Test 9.4: Circular Assignment Logic
1. Create complex overlapping assignments
2. Verify resolution picks correct one based on priority
3. Verify no infinite loops or errors

**Expected Result:** System handles complex assignment scenarios.

### Phase 10: UI/UX Verification

#### Test 10.1: Loading States
1. Verify loading spinners appear during:
   - Template list loading
   - Content saving
   - Assignment creation
2. Verify loaders disappear on completion

**Expected Result:** Clear loading indicators throughout.

#### Test 10.2: Error Handling
1. Trigger various errors:
   - Network failure during save
   - Invalid data submission
   - Unauthorized access
2. Verify error toasts appear
3. Verify forms don't clear on error

**Expected Result:** User-friendly error messages displayed.

#### Test 10.3: Responsive Design
1. Test all pages on mobile viewport
2. Verify template cards stack properly
3. Verify forms are usable on mobile
4. Verify dialogs fit on screen

**Expected Result:** Fully responsive across devices.

#### Test 10.4: Keyboard Navigation
1. Navigate forms using only keyboard
2. Test tab order
3. Verify Enter key submits forms
4. Verify Escape closes dialogs

**Expected Result:** Full keyboard accessibility.

## Performance Testing

### Test 1: Large Menu Structures
- Create navigation menu with 50+ items and 3 levels deep
- Verify editing remains performant
- Verify drag-and-drop still works smoothly

### Test 2: Many Templates
- Create 20+ header templates
- Verify list page loads quickly
- Verify selection dropdowns perform well

### Test 3: Complex Assignment Rules
- Create 10+ assignment rules per template
- Verify resolution is fast (<100ms)
- Check database query performance

## Security Testing

### Test 1: Authorization
- Attempt to access templates from different tenant
- Verify proper access denied errors
- Test RLS policies are working

### Test 2: Input Validation
- Try to inject malicious code in text fields
- Test SQL injection in URL patterns
- Verify XSS protection

### Test 3: CSRF Protection
- Verify all mutations are protected
- Test with invalid CSRF tokens

## Regression Testing

After all features work, verify existing CMS features still function:
- [ ] Page creation and editing
- [ ] Collection management
- [ ] Schema builder for pages/collections
- [ ] Content editor for pages/collections
- [ ] Website management
- [ ] User permissions

## Sign-Off Checklist

- [ ] All database migrations applied successfully
- [ ] Types regenerated without errors
- [ ] All UI pages load without errors
- [ ] Templates can be created, edited, and deleted
- [ ] Schemas can be designed and modified
- [ ] Content can be saved and updated
- [ ] Assignments work with all condition types
- [ ] Page overrides function correctly
- [ ] Resolution logic follows priority order
- [ ] Navigation appears when website is selected
- [ ] Error handling works appropriately
- [ ] Loading states display correctly
- [ ] Mobile responsive design verified
- [ ] No console errors in browser
- [ ] No TypeScript compilation errors
- [ ] Linter passes without errors

## Reporting Issues

When reporting issues, include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser and version
5. Console error messages
6. Network request details (if applicable)
7. Screenshots or screen recordings

## Next Steps

After successful testing:
1. Update main README with header/footer documentation
2. Create user guide for end-users
3. Add example templates to documentation
4. Consider creating video tutorials
5. Set up automated tests for critical paths


