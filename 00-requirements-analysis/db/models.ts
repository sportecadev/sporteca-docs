/**
 * SPORTECA UNIFIED DATABASE MODEL BLUEPRINT 📊🏈
 * 
 * This file serves as the definitive English design schema for the Sporteca consolidated database.
 * It integrates:
 *  1. CORE TRANSACTIONAL: accounts, profiles, teams, etc.
 *  2. REFERENCE DICTIONARIES: mapped as clean domain tables (e.g. Sport, Country) without prefix.
 *  3. UI & SYSTEM RUNTIME CONFIGURATION: prefixed with `cfg_` (e.g. cfg_sport_attribute_definitions).
 *  4. FEDERATED SPORTS REGISTRY: prefixed with `fed_` (e.g. fed_players, fed_teams).
 *  5. HISTORICAL GDPR CONSENT REGISTRY: Versioned terms and policies consent tracking.
 * 
 * Target DB: MySQL 8.x + JPA Jmix / Spring Boot Entity Engine.
 */

// =========================================================================
// 1. ENUMS & ENUMERATIONS
// =========================================================================

export type AccountStatus = 
  | 'PENDING_ACTIVATION'       // Email verification pending
  | 'PENDING_PARENT_CONSENT'   // Under 14 registered, awaiting parent/guardian approval
  | 'ACTIVE_UNVALIDATED'       // Login permitted, profile in pending verification
  | 'FLAGGED_FOR_MANUAL_REVIEW'// AI parser flagged discrepancies, awaiting human operator review
  | 'ACTIVE_VALIDATED'         // Fully verified. Visible in searches, full access
  | 'SUSPENDED';               // Suspended manually by back-office due to post-validation non-compliance

export type AuthProvider = 
  | 'LOCAL'                    // Standard username/password
  | 'GOOGLE'                   // Google OAuth2
  | 'APPLE'                    // Apple Identity OAuth2
  | 'INSTAGRAM'                // Instagram OAuth2
  | 'MICROSOFT_ENTRA'          // Enterprise Azure Entra SSO for Companies
  | 'GOOGLE_WORKSPACE';        // Professional Google SSO for Companies

export type IdentityActionType = 
  | 'ACCOUNT_CREATED'
  | 'PROVIDER_LINKED'
  | 'PROVIDER_UNLINKED'
  | 'PRIMARY_PROVIDER_CHANGED'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_DISABLED'        // Local password masked/disabled (sbiacata) because external provider controls login
  | 'PASSWORD_ENABLED'
  | 'FORCE_LOCAL_AUTH_RESET';  // Emergency back-office operator override action

export type ProfileType = 
  | 'ATHLETE' 
  | 'COMPANY' 
  | 'STAFF';

export type Gender = 'MALE' | 'FEMALE';

export type ValidationStatus = 
  | 'PENDING_REVIEW' 
  | 'APPROVED' 
  | 'REJECTED';

export type ValidationResult = 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'FLAGGED_FOR_MANUAL_REVIEW';

export type DocumentType = 
  | 'IDENTITY_CARD_FRONT' 
  | 'IDENTITY_CARD_BACK' 
  | 'HEALTH_CARD' 
  | 'PARENT_IDENTITY_CARD' 
  | 'CONI_AFFILIATION_CERTIFICATE';

export type RelationStatus = 'PENDING_APPROVAL' | 'LINKED' | 'DISCONNECTED';

export type LegalDocumentCode =
  | 'TERMS_AND_CONDITIONS'
  | 'PRIVACY_POLICY'
  | 'MARKETING_CONSENT'
  | 'PROFILING_CONSENT';

export type FieldType = 
  | 'text'
  | 'password'
  | 'number'
  | 'email'
  | 'date'
  | 'datetime'
  | 'time'
  | 'file'
  | 'select'
  | 'multiselect'
  | 'autocomplete'
  | 'radio'
  | 'textarea'
  | 'checkbox'
  | 'hidden';

export type FieldValidatorType = 
  | 'required'
  | 'minLength'
  | 'maxLength'
  | 'min'
  | 'max'
  | 'step'
  | 'email'
  | 'url'
  | 'pattern';

// =========================================================================
// 2. DYNAMIC FORM CONFIGURATION METADATA (PrimeNG-Aligned)
// =========================================================================

export interface FieldOption {
  value: string | number | boolean;
  label: string;                       // Localized label string
}

export interface FieldValidator {
  type: FieldValidatorType;
  message?: string;                    // Optional custom error message
  value?: number | string;             // Parameter for validation (e.g. minLength value)
}

// =========================================================================
// 3. CORE TRANSACTIONAL SCHEMAS
// =========================================================================

/**
 * @Table("accounts")
 * Centralized identity login record. Dominio email consumer (gmail/outlook) ammesso per tutti.
 * Consents are externalized to account_consents for legal version auditing.
 */
export interface Account {
  id: string;                         // UUID, PK
  email: string;                      // string, Unique, Not Null
  username: string;                   // string, Unique, Not Null
  birthDate: string;                  // DATE, Not Null. Triggers youth restrictions.
  active: boolean;                    // boolean, Spring Security status
  status: AccountStatus;              // Enum, Lifecycle state
  creationProvider: AuthProvider;     // Enum, tracks account creation origin
  primaryProvider: AuthProvider;      // Enum, tracks current active channel
  createdAt: string;                  // Timestamp
  updatedAt: string;                  // Timestamp
}

/**
 * @Table("auth_methods")
 * Mappings of active credentials. If provider != LOCAL, local password is masked/disabled.
 */
export interface AuthMethod {
  id: number;                         // BIGINT, PK, AutoIncrement
  accountId: string;                  // UUID, FK -> accounts.id
  provider: AuthProvider;             // Enum
  providerUserId: string | null;      // string, Unique external IdP Subject ID (e.g. sub claim)
  passwordHash: string | null;        // string, Nullable. Disabled/masked (sbiacata) when provider is social.
  createdAt: string;                  // Timestamp
}

/**
 * @Table("account_identity_audit_logs")
 * Inviolable registry for back-office operators to audit identity links and override access.
 */
export interface AccountIdentityAuditLog {
  id: number;                         // BIGINT, PK, AutoIncrement
  accountId: string;                  // UUID, FK -> accounts.id
  actionType: IdentityActionType;     // Enum
  performedBy: string;                // string: "SYSTEM", "USER", or back-office "<username_operator>"
  oldValue: string | null;            // string, value before change
  newValue: string | null;            // string, value after change
  ipAddress: string;                  // string, client IP address
  timestamp: string;                  // Timestamp, immutable
}

// =========================================================================
// 4. HISTORICAL GDPR & LEGAL CONSENTS SCHEMAS
// =========================================================================

/**
 * @Table("legal_documents")
 * Descriptive taxonomy of system legal documents. Keeps active versions.
 */
export interface LegalDocument {
  id: number;                         // BIGINT, PK
  documentCode: LegalDocumentCode;    // Enum
  name: string;                       // string, e.g. "Privacy Policy"
  version: string;                    // string, e.g. "1.1"
  filePath: string;                   // string, remote GCS path to PDF
  mandatory: boolean;                 // boolean, blocks app usage if false
  active: boolean;                    // boolean, if true, this is the current active version that users must accept
  publishedAt: string;                // Timestamp
}

/**
 * @Table("account_consents")
 * Relational historical log of signed consents. Leveraged for audit trails.
 */
export interface AccountConsent {
  id: number;                         // BIGINT, PK, AutoIncrement
  accountId: string;                  // UUID, FK -> accounts.id (User receiving consent)
  legalDocumentId: number;            // BIGINT, FK -> legal_documents.id
  consentGiven: boolean;              // boolean, true if accepted, false if revoked (optional marketing)
  signedAt: string;                   // Timestamp
  signedByGuardianAccountId: string | null; // UUID, Nullable. FK -> accounts.id (Guardian account who signed on minor behalf)
  ipAddress: string;                  // string, IP of signer
}

// =========================================================================
// 5. DOMAIN DICTIONARIES & REFERENCE TAXONOMIES (No prefix, plural names)
// =========================================================================

/**
 * @Table("countries")
 * Note: Linked directly to provinceId according to updated relational schema.
 */
export interface Country {
  id: number;                         // BIGINT, PK
  code: string;                       // string, Unique, e.g. "IT"
  name: string;                       // string, e.g. "Italy"
  phonePrefix: string;                // string, e.g. "+39"
  provinceId: number;                 // BIGINT, FK -> provinces.id
}

/**
 * @Table("regions")
 */
export interface Region {
  id: number;                         // BIGINT, PK
  code: string;                       // string, Unique, e.g. "LOM"
  name: string;                       // string, e.g. "Lombardia"
  countryId: number;                  // BIGINT, FK -> countries.id
}

/**
 * @Table("provinces")
 */
export interface Province {
  id: number;                         // BIGINT, PK
  code: string;                       // string, Unique, e.g. "MI"
  name: string;                       // string, e.g. "Milano"
  regionId: number;                   // BIGINT, FK -> regions.id
}

/**
 * @Table("sports")
 */
export interface Sport {
  id: number;                         // BIGINT, PK
  code: string;                       // string, Unique, e.g. "SOCCER_11"
  name: string;                       // string, e.g. "Calcio a 11"
  description: string | null;         // string, Nullable
  active: boolean;                    // boolean
}

/**
 * @Table("categories")
 */
export interface Category {
  id: number;                         // BIGINT, PK
  name: string;                       // string, e.g. "Serie D"
  description: string | null;         // string, Nullable
}

/**
 * @Table("roles")
 */
export interface Role {
  id: number;                         // BIGINT, PK
  code: string;                       // string, Unique, e.g. "MIDFIELDER"
  name: string;                       // string, e.g. "Centrocampista"
  description: string | null;         // string, Nullable
  type: 'ATHLETE_ROLE' | 'STAFF_ROLE';// Enum
}

/**
 * @Table("skills")
 */
export interface Skill {
  id: number;                         // BIGINT, PK
  code: string;                       // string, Unique, e.g. "VERTICAL_JUMP"
  name: string;                       // string, e.g. "Salto Verticale"
  description: string | null;         // string, Nullable
  dataType: 'NUMBER' | 'BOOLEAN' | 'STRING'; // Enum
  minValue: number | null;            // double
  maxValue: number | null;            // double
}

// =========================================================================
// 6. UI CONFIGURATION METADATA SCHEMAS (prefixed with `cfg_`)
// =========================================================================

/**
 * @Table("cfg_sport_attribute_definitions")
 * Maps custom fields dynamically to the UI Form Engine (PrimeNG dynamic field model).
 */
export interface SportAttributeDefinition {
  id: number;                         // BIGINT, PK
  sportId: number;                    // BIGINT, FK -> sports.id
  attributeCode: string;              // string, key of JSON map (e.g. "vertical_jump_cm")
  type: FieldType;                    // Enum: text, select, multiselect, date, checkbox
  labelJson: string;                  // JSON string: translated field labels
  placeholderJson: string | null;     // JSON string: translated placeholders
  helpTextJson: string | null;        // JSON string: translated contextual help
  columns: number;                    // number, layout width (grid systemxs/md/lg columns)
  validatorsJson: string | null;      // JSON string mapping FieldValidator[] (e.g. required, min, max)
  optionsJson: string | null;         // JSON string mapping FieldOption[] for SELECT/MULTISELECT types
}

/**
 * @Table("cfg_sport_roles")
 */
export interface SportRole {
  id: number;                         // BIGINT, PK
  sportId: number;                    // BIGINT, FK -> sports.id
  roleId: number;                     // BIGINT, FK -> roles.id
}

/**
 * @Table("cfg_sport_category_skills")
 */
export interface SportCategorySkill {
  id: number;                         // BIGINT, PK
  sportId: number;                    // BIGINT, FK -> sports.id
  categoryId: number;                 // BIGINT, FK -> categories.id
  skillId: number;                    // BIGINT, FK -> skills.id
}

// =========================================================================
// 7. PROFILES SCHEMAS (B2B & B2C Entities)
// =========================================================================

/**
 * @Table("profiles")
 */
export interface Profile {
  id: string;                         // UUID, PK
  accountId: string;                  // UUID, FK -> accounts.id
  type: ProfileType;                  // Enum
  validationStatus: ValidationStatus; // Enum
  createdAt: string;                  // Timestamp
  updatedAt: string;                  // Timestamp
}

/**
 * @Table("profile_personal_infos")
 * Detailed athlete/staff card. Houses the sportAttributes JSON holding custom values.
 */
export interface ProfilePersonalInfo {
  id: number;                         // BIGINT, PK, AutoIncrement
  profileId: string;                  // UUID, FK -> profiles.id
  firstName: string;                  // string, Not Null
  lastName: string;                   // string, Not Null
  gender: Gender;                     // Enum
  fiscalCode: string;                 // string, Unique, Not Null. Validated in backend.
  photoRemoteUrl: string | null;      // string, remote avatar path
  claimedFederatedPlayerId: string | null; // UUID, Nullable. FK -> fed_players.id. THE BRIDGE.
  sportAttributes: string;            // JSON string mapping "fieldName || value" (e.g. {"vertical_jump_cm": 95})
  parentFirstName: string | null;     // string, guardian first name (youth)
  parentLastName: string | null;      // string, guardian last name (youth)
  parentFiscalCode: string | null;    // string, guardian fiscal code (youth)
}

/**
 * @Table("profile_company_infos")
 */
export interface ProfileCompanyInfo {
  id: number;                         // BIGINT, PK, AutoIncrement
  profileId: string;                  // UUID, FK -> profiles.id
  businessName: string;               // string, Not Null (Ragione Sociale)
  vatNumber: string;                  // string, Unique, Not Null (P.IVA)
  legalRepresentativeName: string;    // string, Not Null
  legalRepresentativeFiscalCode: string; // string, Not Null
  affiliationConiCertificate: string; // string, GCS file path
}

/**
 * @Table("profile_addresses")
 * Note: Linked directly to countryId according to updated relational schema.
 */
export interface ProfileAddress {
  id: number;                         // BIGINT, PK, AutoIncrement
  profileId: string;                  // UUID, FK -> profiles.id
  street: string;                     // string
  civicNumber: string;                // string
  postalCode: string | null;          // string
  countryId: number;                  // BIGINT, FK -> countries.id
}

/**
 * @Table("profile_documents")
 */
export interface ProfileDocument {
  id: number;                         // BIGINT, PK, AutoIncrement
  profileId: string;                  // UUID, FK -> profiles.id
  documentType: DocumentType;         // Enum
  filePath: string;                   // string, GCS file path
  uploadTimestamp: string;            // Timestamp
  validUntil: string | null;          // DATE
}

/**
 * @Table("profile_guardian_relations")
 * Maps Parent Account to multiple minor Athlete profiles (Multi-figlio). Legal consents are tracked in account_consents.
 */
export interface ProfileGuardianRelation {
  id: number;                         // BIGINT, PK, AutoIncrement
  guardianAccountId: string;          // UUID, FK -> accounts.id (Parent's login ID)
  minorProfileId: string;             // UUID, FK -> profiles.id (Minor's athlete profile ID)
  status: RelationStatus;             // Enum
  linkedAt: string;                   // Timestamp
  validationNotes: string | null;     // string
}

// =========================================================================
// 8. CLUB TEAMS SCHEMAS (Multi-Squadra)
// =========================================================================

/**
 * @Table("teams")
 * A specific team managed inside a Sports Club (e.g. AC Milan "Juniores Under 19")
 */
export interface Team {
  id: string;                         // UUID, PK
  companyProfileId: string;           // UUID, FK -> profiles.id (The owning Club)
  label: string;                      // string, Not Null, e.g. "Prima Squadra", "Juniores"
  sportId: number;                    // BIGINT, FK -> sports.id
  categoryId: number;                 // BIGINT, FK -> categories.id
  createdAt: string;                  // Timestamp
}

// =========================================================================
// 9. FEDERATED SPORTS REGISTRY (prefixed with `fed_`)
// =========================================================================

/**
 * @Table("fed_championships")
 * Independent Federated Registry - no scraping details exposed.
 */
export interface FederatedChampionship {
  id: string;                         // UUID, PK
  sportId: number;                    // BIGINT, FK -> sports.id
  name: string;                       // string, e.g. "Seconda Categoria - Girone A"
  season: string;                     // string, e.g. "2025/2026"
  lastUpdated: string;                // Timestamp
}

/**
 * @Table("fed_teams")
 */
export interface FederatedTeam {
  id: string;                         // UUID, PK
  name: string;                       // string, e.g. "A.S.D. Paesello Calcio"
  logoUrl: string | null;             // string, path to logo
}

/**
 * @Table("fed_players")
 * Federated athletes. Can be imported via scraper, excel, or created by admin.
 * Once a registered athlete claims a record, it links here.
 */
export interface FederatedPlayer {
  id: string;                         // UUID, PK
  firstName: string;                  // string
  lastName: string;                   // string
  currentTeamId: string;              // UUID, FK -> fed_teams.id
  photoUrl: string | null;            // string, path to photo
}

/**
 * @Table("fed_player_performances")
 * Dynamic sport stats tracked inside the Federated Registry.
 */
export interface FederatedPlayerPerformance {
  id: number;                         // BIGINT, PK, AutoIncrement
  playerId: string;                   // UUID, FK -> fed_players.id
  championshipId: string;             // UUID, FK -> fed_championships.id
  goals: number;                      // number
  penalties: number;                  // number
  assists: number;                    // number
  caps: number;                       // number, matches played
  rating: number;                     // double (average match performance rating)
  lastUpdated: string;                // Timestamp
}

// =========================================================================
// 10. AUDIT & AI VALIDATION SCHEMAS
// =========================================================================

/**
 * @Table("validation_records")
 */
export interface ValidationRecord {
  id: number;                         // BIGINT, PK, AutoIncrement
  profileId: string;                  // UUID, FK -> profiles.id
  verifiedBy: string;                 // string: "AI_PIPELINE" or back-office "<username_operator>"
  result: ValidationResult;           // Enum
  confidenceScore: number;            // double (0.00 - 1.00)
  notes: string;                      // string
  timestamp: string;                  // Timestamp
}
