# Family Data Management System - System Overview

## Project Idea

The Family Data Management System is a comprehensive digital platform designed to manage records of children, breastfeeding mothers, and pregnant women in camp settings. The system aims to digitize and streamline the manual record-keeping process, improving efficiency, accuracy, and accessibility of vital family health data.

### Key Objectives:
- Digitize paper-based records for children, breastfeeding mothers, and pregnant women
- Enable efficient data management with CRUD operations
- Provide role-based access control for different user types
- Support bulk data import/export functionality
- Generate statistical reports and insights
- Ensure data security and privacy


## Pages & Features

### 1. Authentication & Registration Pages
- **Login Page** (`/login`): Secure user authentication for administrators
- **Registration Page** (`/register`): Self-registration for household heads to add records
- **Record Lookup Page** (`/lookup`): Allow household heads to search and view their records without login
- **Role-based Redirection**: Automatic routing based on user role

### 2. Dashboard Page
- **Main Dashboard** (`/dashboard`): Overview with statistics and quick actions
- Displays key metrics: Total children, pregnant women, breastfeeding mothers, camps
- Quick access to common operations

### 3. Children & Breastfeeding Module
#### Pages:
- **Children List** (`/children`): Browse all children and breastfeeding records
- **Add Child Record** (`/children/add`): Create new child and mother records
- **Edit Child Record** (`/children/edit/[id]`): Update existing records
- **View Child Record** (`/children/view/[id]`): Detailed view of individual records

#### Features:
- Child information (full name, ID, date of birth, health status)
- Parent information (father and mother details)
- Breastfeeding status
- Health notes and observations

### 4. Pregnant Women Module
#### Pages:
- **Pregnant Women List** (`/pregnant`): Browse all pregnant women records
- **Add Pregnant Woman Record** (`/pregnant/add`): Create new pregnancy records
- **Edit Pregnant Woman Record** (`/pregnant/edit/[id]`): Update existing records
- **View Pregnant Woman Record** (`/pregnant/view/[id]`): Detailed view of individual records

#### Features:
- Pregnant woman information (full name, ID, health status)
- Pregnancy details (month of pregnancy)
- Spouse information
- Health notes and observations

### 5. Data Import/Export Module
#### Pages:
- **Bulk Import** (`/import`): Import multiple records from Excel files
- **Bulk Export** (`/export`): Export multiple records to Excel files
- **Template Download**: Download standardized Excel templates

#### Features:
- Excel-based bulk data import
- Excel-based bulk data export
- Data validation and error reporting
- Standardized templates for consistent data entry

### 6. Settings Module
#### Pages:
- **System Settings** (`/settings`): Configure system parameters
- **User Management**: Manage user accounts and permissions

#### Features:
- Role-based access control
- System configuration options
- User account management

### 7. Household Head Self-Registration Portal
#### Pages:
- **Registration Page** (`/register`): Allow household heads to register new records
- **Record Lookup Page** (`/lookup`): Allow household heads to search and view their records
- **Self-Service Editing**: Ability to update/delete their own records

## User Roles & Workflows

### 1. Administrator Role

#### Access Rights:
- Full access to all system modules
- Ability to create, read, update, and delete all records
- Access to system settings and user management
- View all statistical reports
- Access to import/export functionality
- Full editing capabilities

#### Administrative Workflows:

**A. Daily Operations Workflow:**
1. **Login & Dashboard Review**
   - Authenticate with admin credentials
   - Review dashboard statistics for daily overview
   - Check for any alerts or urgent updates needed
   - Monitor system usage and activity

2. **Record Management**
   - Navigate to `/children` or `/pregnant` to browse records
   - Use filters to find specific records or groups
   - Add new records using `/children/add` or `/pregnant/add`
   - Edit existing records using edit functionality
   - View detailed records using view pages
   - Archive or deactivate old records when needed

3. **Data Quality Assurance**
   - Regularly review records for completeness
   - Update incomplete or outdated information
   - Validate data accuracy against source documents
   - Generate reports to identify data gaps

**B. Data Import Workflow:**
1. **Prepare Data**
   - Download Excel template from `/import`
   - Fill template with new records following format guidelines
   - Validate data locally before upload

2. **Upload Process**
   - Navigate to `/import` page
   - Upload prepared Excel file
   - Review import preview and validate data mapping
   - Execute import and monitor progress
   - Address any errors or conflicts reported

3. **Post-Import Verification**
   - Verify imported records appear correctly
   - Cross-check random samples for accuracy
   - Update any discrepancies found

**C. User Management Workflow:**
1. **Access Control**
   - Navigate to `/settings` for user management
   - Create new user accounts with appropriate roles
   - Assign permissions based on responsibilities
   - Deactivate accounts when no longer needed

2. **System Configuration**
   - Configure system-wide settings
   - Update camp information and locations
   - Adjust notification settings
   - Manage backup and maintenance schedules

### 2. Household Head (Self-Registration) Role

#### Access Rights:
- Access to self-registration functionality
- Ability to register children/breastfeeding records or pregnant women records
- Ability to search and view their own records using ID numbers
- Ability to update/delete their own records
- No access to system settings or administrative functions

#### Household Head Workflows:

**A. Self-Registration Workflow:**
1. **Access Registration Interface**
   - On homepage or login page, click "Register New Record" button
   - System presents registration options: "Children & Breastfeeding" or "Pregnant Women"

2. **Select Record Type**
   - Choose "Children & Breastfeeding" to register child and mother information
   - OR choose "Pregnant Women" to register pregnancy information
   - System loads appropriate form with required fields

3. **Complete Registration Form**
   - For "Children & Breastfeeding":
     * Child's full name, ID number, date of birth, health status
     * Father's full name and ID number
     * Mother's full name and ID number
     * Breastfeeding status
     * Additional notes
   - For "Pregnant Women":
     * Wife's full name and ID number
     * Pregnancy month
     * Husband's full name and ID number
     * Health status
     * Additional notes

4. **Submit Registration**
   - Validate all required fields
   - Submit form to create new record
   - Receive confirmation of successful registration

**B. Record Search & Management Workflow:**
1. **Access Search Interface**
   - On homepage or login page, click "View My Records" button
   - System presents search options: "Children & Breastfeeding" or "Pregnant Women"

2. **Enter Identification Information**
   - For "Children & Breastfeeding": Enter either Father ID Number OR Mother ID Number
   - For "Pregnant Women": Enter either Wife ID Number OR Husband ID Number
   - System validates ID format and searches for associated records

3. **View Records**
   - System displays all records associated with the entered ID
   - Household head can view complete record details
   - Option to edit or delete their own records

4. **Edit/Delete Records**
   - Click "Edit" to modify record information
   - Update allowed fields with new information
   - Save changes to update the record
   - OR click "Delete" to remove the record (with confirmation)

### 3. Guest/Unauthenticated Users

#### Access Rights:
- No access to protected pages
- Redirected to login page when attempting to access protected content
- Access to login interface only
- No data viewing or modification capabilities

#### Guest Workflow:
1. **Attempt Access**
   - Try to navigate to any system page
   - Automatically redirected to `/login`

2. **Authentication Required**
   - See login interface with instructions
   - Contact system administrator for credentials
   - No further system access until authenticated

## Data Models

### Children & Breastfeeding Records
- Child Information: Full name, ID number, date of birth, health status
- Parent Information: Father and mother names, ID numbers
- Breastfeeding Status: Boolean indicating breastfeeding status
- Health Notes: Additional observations and notes
- Camp Information: Associated camp details

### Pregnant Women Records
- Personal Information: Full name, ID number, health status
- Pregnancy Details: Month of pregnancy
- Spouse Information: Husband's name and ID number
- Health Notes: Additional observations and notes
- Camp Information: Associated camp details

## Technical Features

### Security
- JWT-based authentication for administrators
- Public access for household head registration and lookup
- Role-based access control
- Protected API routes
- Secure data transmission
- ID-based record access validation

### Data Validation
- Client-side form validation
- Server-side data validation
- Excel import validation
- Data integrity checks

### Performance
- Optimized database queries
- Efficient data fetching
- Caching strategies
- Responsive UI components

### Usability
- RTL (right-to-left) language support
