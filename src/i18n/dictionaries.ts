// Lightweight in-house i18n. No dependency. `en` is the source of truth; `es`
// mirrors its keys. Components read strings via useT() -> t("group.key").
export type Lang = "en" | "es";

export const en = {
  common: {
    appName: "EASER Research Data Hub",
    signIn: "Sign in", register: "Register", logout: "Logout",
    contribute: "Contribute", browse: "Browse", search: "Search",
    documentation: "Documentation", home: "Home", ourWork: "Our Work", team: "Team", news: "News", contact: "Contact", dashboard: "My Dashboard", profile: "Profile",
    reviewQueue: "Review Queue", userManagement: "User Management",
    loading: "Loading…", back: "Back", refresh: "Refresh", save: "Save",
    email: "Email", password: "Password", optional: "Optional",
    none: "None.", notSpecified: "Not specified.", viewOnGithub: "View on GitHub"
  },
  roles: { researcher: "Researcher", curator: "Curator", admin: "Administrator" },
  statuses: {
    draft: "Draft", submitted: "Submitted", under_review: "Under Review",
    changes_requested: "Changes Requested", approved: "Approved",
    published: "Published", rejected: "Rejected"
  },
  home: {
    heroTitle: "Contribute to the EASER research repository — without touching Git.",
    heroSubtitle: "A professional web interface to submit models, datasets, GIS layers, reports and code. GitHub stays the central source of truth; we handle the rest.",
    submitCta: "Submit a project", browseCta: "Browse the repository",
    aboutTitle: "About EASER",
    aboutBody: "EASER is a multi-institutional research initiative. The repository collects computational models, scientific datasets, GIS and spatial information, research reports, documentation, scripts and technical resources. This hub lowers the barrier to contributing while preserving rigorous, curated version control on GitHub.",
    howTitle: "How contributing works",
    featuredTitle: "Featured projects", recentTitle: "Recent projects",
    categoriesTitle: "What you can contribute",
    readyTitle: "Ready to add your work to EASER?", noProjects: "No published projects yet.",
    updated: "Updated"
  },
  auth: {
    signInTitle: "Sign in", signInSubtitle: "Access your dashboard and contributions.",
    forgot: "Forgot password?", create: "Create account", continueGoogle: "Continue with Google", or: "or",
    registerTitle: "Create your account", registerSubtitle: "Researchers can submit and manage contributions.",
    fullName: "Full name", confirmPassword: "Confirm password", pwMin: "Password must be at least 8 characters.",
    pwMismatch: "Passwords do not match.", alreadyHave: "Already have an account?",
    resetTitle: "Reset your password", resetHint: "We'll email you a reset link.",
    sendReset: "Send reset link", resetSent: "If an account exists, a reset link has been sent. Check your inbox.",
    backToSignIn: "Back to sign in", creating: "Creating…", signingIn: "Signing in…"
  },
  dashboard: {
    myProjects: "My projects", newProject: "+ New project",
    submittedBanner: "Your project was submitted for review. You'll be notified by email.",
    resume: "Resume", revise: "Revise", inReview: "In review", noneYet: "You have no projects yet.", start: "Start one"
  },
  contribute: {
    titleNew: "Contribute a project", titleEdit: "Edit project",
    intro: "One project, many files. Add your authors and institutions, upload your files, and submit — a curator reviews everything and the platform writes the documentation. No Git required.",
    project: "Project", authors: "Authors", institutions: "Institutions", filesSection: "Files",
    technical: "Technical details", optionalHelp: "These fields are optional. Adding categories and technical metadata helps others discover, understand, and reuse your work.", addAuthor: "+ Add author", addInstitution: "+ Add institution",
    title: "Title", category: "Category", description: "Description", purpose: "Purpose",
    keywords: "Keywords", license: "License", contactName: "Contact name", contactEmail: "Contact email",
    dragHint: "Drag files here, or", browseFiles: "Browse files", uploading: "Uploading…", noFiles: "No files yet.",
    saveDraft: "Save draft", submitReview: "Submit for review", saving: "Saving…", submitting: "Submitting…",
    publishNote: "Nothing is published until a curator approves it.",
    signInPrompt: "Please sign in or create an account to contribute a project."
  },
  profile: {
    title: "Profile", details: "Details", picture: "Profile picture (optional)",
    displayName: "Display name", institution: "Institution", saveProfile: "Save profile",
    changePassword: "Change password", currentPw: "Current password", newPw: "New password",
    confirmNewPw: "Confirm new password", updatePassword: "Update password"
  },
  search: {
    title: "Search", subtitle: "Search published projects and repository files.",
    placeholder: "Search title, author, keyword…", filters: "Filters",
    allCategories: "All categories", allYears: "All years", allInstitutions: "All institutions",
    allAuthors: "All authors", projects: "Published projects", repoFiles: "Repository files",
    noResults: "No results.", apply: "Search", clear: "Clear"
  },
  docs: { title: "Documentation", subtitle: "Auto-generated, curator-reviewed documentation for every published project.", empty: "No projects have been published yet. Documentation for projects approved by the EASER team will appear here soon." },
  researchers: { title: "Researchers", subtitle: "Contributors to the EASER repository.", contributions: "contributions", profileOf: "Projects by" },
  admin: {
    usersTitle: "User Management", reviewTitle: "Review queue", decision: "Decision",
    promote: "Promote", demote: "Demote", activate: "Activate", deactivate: "Deactivate",
    role: "Role", active: "Active", inactive: "Inactive", you: "you",
    generate: "Generate", regenerate: "Regenerate", edit: "Edit", preview: "Preview",
    approvePublish: "Approve & publish to GitHub", requestChanges: "Request changes", reject: "Reject"
  },
  lang: {
    chooseTitle: "Welcome to EASER Research Data Hub",
    chooseSubtitle: "Choose your language · Elige tu idioma",
    english: "English", spanish: "Español"
  }
};

export type Dict = typeof en;

export const es: Dict = {
  common: {
    appName: "EASER Research Data Hub",
    signIn: "Iniciar sesión", register: "Registrarse", logout: "Cerrar sesión",
    contribute: "Contribuir", browse: "Explorar", search: "Buscar",
    documentation: "Documentación", home: "Inicio", ourWork: "Nuestro trabajo", team: "Equipo", news: "Novedades", contact: "Contacto", dashboard: "Mi panel", profile: "Perfil",
    reviewQueue: "Cola de revisión", userManagement: "Gestión de usuarios",
    loading: "Cargando…", back: "Volver", refresh: "Actualizar", save: "Guardar",
    email: "Correo", password: "Contraseña", optional: "Opcional",
    none: "Ninguno.", notSpecified: "No especificado.", viewOnGithub: "Ver en GitHub"
  },
  roles: { researcher: "Investigador/a", curator: "Curador/a", admin: "Administrador/a" },
  statuses: {
    draft: "Borrador", submitted: "Enviado", under_review: "En revisión",
    changes_requested: "Cambios solicitados", approved: "Aprobado",
    published: "Publicado", rejected: "Rechazado"
  },
  home: {
    heroTitle: "Contribuye al repositorio de investigación EASER — sin usar Git.",
    heroSubtitle: "Una interfaz web profesional para enviar modelos, datos, capas GIS, informes y código. GitHub sigue siendo la fuente central de verdad; nosotros hacemos el resto.",
    submitCta: "Enviar un proyecto", browseCta: "Explorar el repositorio",
    aboutTitle: "Acerca de EASER",
    aboutBody: "EASER es una iniciativa de investigación multiinstitucional. El repositorio reúne modelos computacionales, conjuntos de datos científicos, información GIS y espacial, informes de investigación, documentación, scripts y recursos técnicos. Esta plataforma reduce la barrera para contribuir manteniendo un control de versiones riguroso y curado en GitHub.",
    howTitle: "Cómo funciona contribuir",
    featuredTitle: "Proyectos destacados", recentTitle: "Proyectos recientes",
    categoriesTitle: "Qué puedes contribuir",
    readyTitle: "¿Listo para añadir tu trabajo a EASER?", noProjects: "Aún no hay proyectos publicados.",
    updated: "Actualizado"
  },
  auth: {
    signInTitle: "Iniciar sesión", signInSubtitle: "Accede a tu panel y tus contribuciones.",
    forgot: "¿Olvidaste tu contraseña?", create: "Crear cuenta", continueGoogle: "Continuar con Google", or: "o",
    registerTitle: "Crea tu cuenta", registerSubtitle: "Los investigadores pueden enviar y gestionar contribuciones.",
    fullName: "Nombre completo", confirmPassword: "Confirmar contraseña", pwMin: "La contraseña debe tener al menos 8 caracteres.",
    pwMismatch: "Las contraseñas no coinciden.", alreadyHave: "¿Ya tienes una cuenta?",
    resetTitle: "Restablece tu contraseña", resetHint: "Te enviaremos un enlace por correo.",
    sendReset: "Enviar enlace", resetSent: "Si existe una cuenta, se ha enviado un enlace. Revisa tu correo.",
    backToSignIn: "Volver a iniciar sesión", creating: "Creando…", signingIn: "Entrando…"
  },
  dashboard: {
    myProjects: "Mis proyectos", newProject: "+ Nuevo proyecto",
    submittedBanner: "Tu proyecto fue enviado a revisión. Te notificaremos por correo.",
    resume: "Continuar", revise: "Revisar", inReview: "En revisión", noneYet: "Aún no tienes proyectos.", start: "Crear uno"
  },
  contribute: {
    titleNew: "Contribuir un proyecto", titleEdit: "Editar proyecto",
    intro: "Un proyecto, muchos archivos. Añade tus autores e instituciones, sube tus archivos y envía — un curador revisa todo y la plataforma redacta la documentación. Sin Git.",
    project: "Proyecto", authors: "Autores", institutions: "Instituciones", filesSection: "Archivos",
    technical: "Detalles técnicos", optionalHelp: "Estos campos son opcionales. Añadir categorías y metadatos técnicos ayuda a que otros descubran, entiendan y reutilicen tu trabajo.", addAuthor: "+ Añadir autor", addInstitution: "+ Añadir institución",
    title: "Título", category: "Categoría", description: "Descripción", purpose: "Propósito",
    keywords: "Palabras clave", license: "Licencia", contactName: "Nombre de contacto", contactEmail: "Correo de contacto",
    dragHint: "Arrastra archivos aquí, o", browseFiles: "Seleccionar archivos", uploading: "Subiendo…", noFiles: "Aún no hay archivos.",
    saveDraft: "Guardar borrador", submitReview: "Enviar a revisión", saving: "Guardando…", submitting: "Enviando…",
    publishNote: "Nada se publica hasta que un curador lo apruebe.",
    signInPrompt: "Inicia sesión o crea una cuenta para contribuir un proyecto."
  },
  profile: {
    title: "Perfil", details: "Datos", picture: "Foto de perfil (opcional)",
    displayName: "Nombre visible", institution: "Institución", saveProfile: "Guardar perfil",
    changePassword: "Cambiar contraseña", currentPw: "Contraseña actual", newPw: "Nueva contraseña",
    confirmNewPw: "Confirmar nueva contraseña", updatePassword: "Actualizar contraseña"
  },
  search: {
    title: "Buscar", subtitle: "Busca proyectos publicados y archivos del repositorio.",
    placeholder: "Buscar título, autor, palabra clave…", filters: "Filtros",
    allCategories: "Todas las categorías", allYears: "Todos los años", allInstitutions: "Todas las instituciones",
    allAuthors: "Todos los autores", projects: "Proyectos publicados", repoFiles: "Archivos del repositorio",
    noResults: "Sin resultados.", apply: "Buscar", clear: "Limpiar"
  },
  docs: { title: "Documentación", subtitle: "Documentación generada automáticamente y revisada por curadores para cada proyecto publicado.", empty: "Aún no existen proyectos publicados. La documentación de los proyectos aprobados por el equipo EASER aparecerá aquí próximamente." },
  researchers: { title: "Investigadores", subtitle: "Contribuyentes del repositorio EASER.", contributions: "contribuciones", profileOf: "Proyectos de" },
  admin: {
    usersTitle: "Gestión de usuarios", reviewTitle: "Cola de revisión", decision: "Decisión",
    promote: "Promover", demote: "Degradar", activate: "Activar", deactivate: "Desactivar",
    role: "Rol", active: "Activo", inactive: "Inactivo", you: "tú",
    generate: "Generar", regenerate: "Regenerar", edit: "Editar", preview: "Vista previa",
    approvePublish: "Aprobar y publicar en GitHub", requestChanges: "Solicitar cambios", reject: "Rechazar"
  },
  lang: {
    chooseTitle: "Bienvenido a EASER Research Data Hub",
    chooseSubtitle: "Choose your language · Elige tu idioma",
    english: "English", spanish: "Español"
  }
};

export const DICTS: Record<Lang, Dict> = { en, es };
