import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot, getDocs, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";




window.authMode = 'login'; 

window.switchAuthTab = function(mode) {
    window.authMode = mode;
    console.log("Cambiando a modo:", mode);
    
    // 1. UI: Alternar pestañas activas (Imagen 3)
    document.getElementById('tab-login').classList.toggle('active-tab', mode === 'login');
    document.getElementById('tab-register').classList.toggle('active-tab', mode === 'register');
    
    // 2. UI: Actualizar Textos del Banner Magenta (Imágenes 1 y 2)
    const titleEl = document.getElementById('auth-title');
    const subtitleEl = document.getElementById('auth-subtitle');
    const submitBtn = document.getElementById('auth-submit-btn');
    const forgotLink = document.getElementById('forgot-password-link');
    
    if (mode === 'register') {
        titleEl.innerText = "Regístrate"; // Texto Imagen 2
        subtitleEl.innerText = "Forma parte de nuestra comunidad"; // Texto Imagen 2
        submitBtn.innerText = "CREAR CUENTA";
        forgotLink.style.display = "none"; // Ocultar recuperación en modo registro
    } else {
        titleEl.innerText = "¡Bienvenid@!"; // Texto Imagen 1
        subtitleEl.innerText = "Accede a tu espacio en Anyelina Digital"; // Texto Imagen 1
        submitBtn.innerText = "INGRESAR";
        forgotLink.style.display = "block"; // Mostrar recuperación en modo login
    }

    // Limpiar errores de intentos anteriores
    document.getElementById('auth-error').innerText = '';
};





window.handleAuthSubmit = async function(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorDiv = document.getElementById('auth-error');
    errorDiv.innerText = '';
    
    document.getElementById('loading').style.display = 'flex';

    try {
        if (window.authMode === 'register') {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, 'usuarios', cred.user.uid), {
                email: email,
                fechaRegistro: new Date().toISOString(),
                role: 'user',
                nombre: "", empresa: "", cedula: "", telefono: "", direccion: "", planes: []
            });
            window.closeModal('modal-auth');
            window.showClientArea(); // Lleva al usuario a su área sin recargar la página
        } else {
            await signInWithEmailAndPassword(auth, email, password);
            location.reload();
        }
    } catch(err) {
        document.getElementById('loading').style.display = 'none';
        errorDiv.style.color = "red";
        if (err.code === 'auth/email-already-in-use') {
            errorDiv.innerText = "Este correo ya está registrado.";
        } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
            errorDiv.innerText = "Contraseña o correo incorrecto.";
        } else {
            errorDiv.innerText = "Error: " + err.message;
        }
    }
};

window.recuperarPassword = async function() {
    const email = document.getElementById('auth-email').value;
    const errorDiv = document.getElementById('auth-error');
    
    if (!email) {
        errorDiv.style.color = "red";
        errorDiv.innerText = "Por favor, escribe tu correo electrónico arriba primero.";
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        errorDiv.style.color = "green";
        errorDiv.innerText = "¡Enlace enviado! Revisa tu bandeja de entrada o spam.";
    } catch (error) {
        errorDiv.style.color = "red";
        errorDiv.innerText = "Error: " + error.message;
    }
};








// Configuración de Firebase
const encodedConfig = "eyJhcGlLZXkiOiJBSXphU3lDZFlOOVp5Z1BnQXNDYmd0TmU1LXo5VWhrdjhUdzlsUmMiLCJhdXRoRG9tYWluIjoiYW55ZWxpbmEtZGlnaXRhbC5maXJlYmFzZWFwcC5jb20iLCJwcm9qZWN0SWQiOiJhbnllbGluYS1kaWdpdGFsIiwic3RvcmFnZUJ1Y2tldCI6ImFueWVsaW5hLWRpZ2l0YWwuZmlyZWJhc2VzdG9yYWdlLmFwcCIsIm1lc3NhZ2luZ1NlbmRlcklkIjoiMTAxNDk0MDAxMzM0MiIsImFwcElkIjoiMToxMDE0OTQwMDEzMzQyOndlYjo0NTBhNDZmZWZiYjljZDQwMjQ2ZjBmIiwibWVhc3VyZW1lbnRJZCI6IkctSDM2OTM4UzRNNyJ9";
const firebaseConfig = JSON.parse(atob(encodedConfig));

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Variables globais
window.currentUserId = null;
window.userEmail = "";
window.userProfileData = null;
window.userPaymentsData = [];
window.calculoTotalDeuda = 0;
window.authMode = 'login'; 

const ADMIN_EMAIL = atob('ZGlnaXRhbHZpYmVzLnZlQGdtYWlsLmNvbQ=='); 
window.isDelegatedAdmin = false;

// Ocultar carga inicial
document.getElementById('loading').style.display = 'none';
document.getElementById('current-year').textContent = new Date().getFullYear();

// ==================== LÓGICA DE TRADUCIÓN E IDIOMA ====================
const translations = {
    es: {
        searchUserPlaceholder: "Buscar usuario...",
        loading: "Cargando plataforma...", chatWithUs: "¿Hablamos?", navPlans: "Planes", navDesign: "Diseño", navQuote: "Cotizar", navClientArea: "Área Cliente", navAdminPanel: "Panel de Control",
        heroMsg1: '"Tu marca es una extensión de Ti"', heroMsg2: '"Transformamos ideas en resultados digitales de alto impacto."', heroMsg3: '"Estrategia, diseño y ejecución impecable."',
        aboutTitle: "Hola, soy Anyelina", aboutText: "Creadora de Anyelinadigital.ve. Me dedico al marketing digital, creación de contenido y gestión de redes sociales, ayudando a marcas y emprendedores a comunicar quiénes son realmente en redes.",
        objTitle: "Nuestros Objetivos", obj1: "Crear contenido audiovisual estratégico.", obj2: "Fomentar la participación del público objetivo.", obj3: "Atraer nuevos usuarios y convertirlos en clientes.",
        creatorBadge: "Creadora Digital", galleryTitle: "Nuestra Estética", testimonialsTitle: "Lo que dicen nuestras marcas", loadingTestimonials: "Cargando testimonios...",
        setupTitle: "Completar Perfil y Servicios", setupDesc: "Para acceder a tu panel de pagos, necesitamos tus datos completos.", setupStep1: "1. Datos de Contacto y Facturación", setupStep2: "Selecciona los servicios que deseas incluir:",
        catSocialMgt: "Gestión de Redes Sociales", catContentCreation: "Creación de Contenido", catDesignId: "Diseño e Identidad", catPacksProd: "Packs y Producción",
        lblPlanCreativo: "Plan Creativo ($140)", lblPlanInnovador: "Plan Innovador ($165)", lblPlanVibes: "Plan Vibes ($200)",
        lblPlanCreativoCont: "Plan Creativo ($120)", lblPlanInnovadorCont: "Plan Innovador ($135)", lblPlanVibesCont: "Plan Vibes ($150)",
        itemFullId: "Identidad Completa ($220)", itemRebrand: "Rebranding ($110)", itemBasicPack: "Pack Básico ($75)", itemImpulse: "Pack Impulso ($35)", item8Reels: "Pack 8 Reels ($100)", itemRecording: "Pauta Grabación 1h ($35)", itemConsulting: "Asesoría 1:1 ($25)",
        ttCreativo: "Planificación de visión de marca, 6 publicaciones (diseños e imágenes), 2 reels mensuales, Historias L-M-V, 1 Pauta de grabación, 1 Anuncio, Estadísticas.",
        ttInnovador: "Planificación de visión de marca, 8 publicaciones (diseños e imágenes), 2 reels mensuales, Historias L-M-V, 1 Pauta de grabación, 2 Anuncios, Estadísticas.",
        ttVibes: "Planificación de visión de marca, 8 publicaciones (diseños e imágenes), 4 reels mensuales, Historias diarias (L-V), 2 Pautas de grabación, 3 Anuncios, Estadísticas.",
        ttCreativoCont: "4 diseños, 4 Imágenes, 2 reels, Control de publicaciones.", ttInnovadorCont: "6 diseños, 6 imágenes, 4 reels, Control de publicaciones.", ttVibesCont: "8 diseños, 8 imágenes, 6 reels, Control de publicaciones.",
        ttFullId: "Creación de logo, manual de marca, paleta de colores y tipografías.", ttRebrand: "Actualización y refrescamiento de tu identidad visual existente.", ttBasicPack: "Diseño de elementos básicos para iniciar tu marca de manera profesional.",
        ttImpulse: "Estrategia rápida para aumentar tu visibilidad en un mes.", tt8Reels: "Grabación y edición de 8 videos cortos optimizados para TikTok/Instagram.", ttRecording: "Sesión de fotos y grabación de video presencial por 1 hora continua.", ttConsulting: "Guía y estructuración digital personalizada.",
        totalToBill: "Total a Facturar (Deuda Inicial): ", btnLogout: "CERRAR SESIÓN", btnSaveContinue: "GUARDAR Y CONTINUAR",
        welcome: "Bienvenido,", company: "Empresa:", activeServices: "Servicios Activos:", btnAccountStatement: "Estado de Cuenta",
        totalDebt: "Deuda Total (Debe)", paidAmount: "Abonado (Aprobado)", pendingBalance: "Saldo Pendiente", statusOverdue: "VENCIDO",
        reportPaymentTitle: "Reportar Nuevo Pago", lblPaymentMethod: "Método de Pago *", optSelect: "Seleccione...", optTransfer: "Transferencia Bancaria (Bs)", optMobilePay: "Pago Móvil (Bs)", optCash: "Efectivo",
        optSelectBank: "Seleccione Banco Emisor...", lblAmountBs: "Monto Pagado (Bs) *", lblEuroRate: "Tasa de Cambio Oficial (Euro) *", lblEquivalentUsd: "Equivalente en Dólares ($)", lblEquivalentEur: "Equivalente en Euros (€)", lblAmountUsd: "Monto Pagado ($) *", lblRefNum: "Número de Referencia *", lblTxDate: "Fecha de la Transacción *", btnSendReport: "ENVIAR REPORTE",
        historyTitle: "Historial de Recibos Emitidos", thIndex: "Nº", thDate: "Fecha", thMethod: "Método", thRef: "Referencia", thAmount: "Monto", thStatus: "Estatus", thAction: "Acción", lblShow: "Mostrar:", optAll: "Todos", noPayments: "No hay pagos registrados aún.",
        addServicesTitle: "Adquirir Servicios Adicionales", addServicesDesc: "¿Deseas agregar más valor a tu marca? Selecciona servicios extras y genera una orden de compra.", totalSelected: "Total Seleccionado:", btnGenerateOrder: "Generar Orden (PDF)", orderPdfTitle: "ORDEN DE SERVICIOS ADICIONALES",
        adminDesc: "Gestión de pagos, validaciones y usuarios.", btnBackProfile: "Volver a mi perfil", adminPendingTitle: "Pagos Pendientes por Validar", adminPendingDesc: "Aquí se muestran los pagos reportados por los clientes con estatus 'Procesando'.",
        thClient: "Cliente / Empresa", thMethodRef: "Método / Ref", adminUsersTitle: "Gestión de Usuarios Registrados", adminUsersDesc: "Administra cuentas, edita perfiles, asigna delegados o elimina usuarios de prueba.",
        thName: "Nombre", thCompany: "Empresa / Marca", thEmail: "Correo Electrónico", loginTitle: "Iniciar Sesión", tabLogin: "Ingresar", tabRegister: "Crear Cuenta", btnEnter: "ENTRAR", orGoogle: "O puedes", btnGoogle: "Continuar con Google",
        editUserTitle: "Editar Perfil de Usuario", lblContactName: "Nombre del Representante", lblCompanyName: "Nombre de la Empresa o Marca", lblIdNum: "Cédula / RIF", lblPhone: "Teléfono", lblAddress: "Dirección Completa", btnSaveChanges: "GUARDAR CAMBIOS",
        clientReceiptsTitle: "Recibos del Cliente", modalPlansTitle: "Planes de Gestión de Redes Sociales", plan1Title: "Plan Creativo", plan2Title: "Plan Innovador", plan3Title: "Plan Vibes", perMonth: "/mes",
        featBrandVision: "Planificación de visión de marca", featSchedule: "Cronograma mensual de contenido", feat6Posts: "6 publicaciones (diseños e imágenes)", feat8Posts: "8 publicaciones (diseños e imágenes)", feat2Reels: "2 reels mensuales", feat4Reels: "4 reels mensuales", featStoriesLMV: "Historias L-M-V", featStoriesDaily: "Historias diarias (L-V)", feat1Shoot: "1 Pauta de grabación y fotos", feat2Shoots: "2 Pautas de grabación y fotos", feat1Ad: "1 Anuncio (inversión aparte)", feat2Ads: "2 Anuncios (inversión aparte)", feat3Ads: "3 Anuncios (inversión aparte)", featStats: "Estadísticas mensuales",
        btnChoosePlan: "ELEGIR PLAN", badgePopular: "Más Popular", modalDesignTitle: "Diseño e Identidad Visual", designVisualDev: "Desarrollo Visual", designPacksSpecial: "Packs y Especiales", btnChooseService: "ELEGIR SERVICIO",
        modalQuoteTitle: "Cotización Personalizada", quoteDesc: "Arma tu propio paquete seleccionando los servicios de tu interés.", lblEstimatedBudget: "Presupuesto Estimado: ", placeholderQuoteMsg: "¿Algún detalle o duda adicional para tu negocio? (Opcional)", btnSendQuote: "ENVIAR COTIZACIÓN", totalVisits: "Visitas totales registradas:",
        creditBalance: "Saldo a Favor", statusCredit: "A FAVOR",
        adminTestimonialsTitle: "Gestión de Testimonios Reales", adminTestimonialsDesc: "Sube capturas de pantalla de los testimonios o mensajes reales de tus clientes para mostrarlos en el carrusel de la página de inicio. Te recomendamos usar imágenes cuadradas o ligeramente verticales.", lblClientName: "Nombre del Cliente / Marca", lblClientImage: "Imagen (Captura o Foto)", btnUpload: "Subir", thImage: "Imagen"
    
    },
    en: {
        searchUserPlaceholder: "Search user...", loading: "Loading platform...", chatWithUs: "Chat with us", navPlans: "Plans", navDesign: "Design", navQuote: "Quote", navClientArea: "Client Area", navAdminPanel: "Admin Panel", heroMsg1: '"Your brand is an extension of You"', heroMsg2: '"We transform ideas into high-impact digital results."', heroMsg3: '"Strategy, design, and flawless execution."', aboutTitle: "Hi, I'm Anyelina", aboutText: "Creator of Anyelinadigital.ve. I dedicate myself to digital marketing, content creation, and social media management, helping brands and entrepreneurs communicate who they really are online.", objTitle: "Our Goals", obj1: "Create strategic audiovisual content.", obj2: "Encourage target audience engagement.", obj3: "Attract new users and convert them into clients.", creatorBadge: "Digital Creator", galleryTitle: "Our Aesthetics", testimonialsTitle: "What our brands say", loadingTestimonials: "Loading testimonials...", setupTitle: "Complete Profile and Services", setupDesc: "To access your payment panel, we need your complete details.", setupStep1: "1. Contact and Billing Information", setupStep2: "Select the services you want to include:", catSocialMgt: "Social Media Management", catContentCreation: "Content Creation", catDesignId: "Design & Identity", catPacksProd: "Packs & Production", lblPlanCreativo: "Creative Plan ($140)", lblPlanInnovador: "Innovative Plan ($165)", lblPlanVibes: "Vibes Plan ($200)", lblPlanCreativoCont: "Creative Plan ($120)", lblPlanInnovadorCont: "Innovative Plan ($135)", lblPlanVibesCont: "Vibes Plan ($150)", itemFullId: "Full Identity ($220)", itemRebrand: "Rebranding ($110)", itemBasicPack: "Basic Pack ($75)", itemImpulse: "Impulse Pack ($35)", item8Reels: "8 Reels Pack ($100)", itemRecording: "1h Recording Session ($35)", itemConsulting: "1:1 Consulting ($25)", ttCreativo: "Brand vision planning, 6 posts (designs & images), 2 monthly reels, Stories M-W-F, 1 Recording session, 1 Ad, Monthly stats.", ttInnovador: "Brand vision planning, 8 posts (designs & images), 2 monthly reels, Stories M-W-F, 1 Recording session, 2 Ads, Monthly stats.", ttVibes: "Brand vision planning, 8 posts (designs & images), 4 monthly reels, Daily stories (M-F), 2 Recording sessions, 3 Ads, Monthly stats.", ttCreativoCont: "4 designs, 4 images, 2 reels, Post scheduling.", ttInnovadorCont: "6 designs, 6 images, 4 reels, Post scheduling.", ttVibesCont: "8 designs, 8 images, 6 reels, Post scheduling.", ttFullId: "Logo creation, brand manual, color palette, and typography.", ttRebrand: "Update and refresh your existing visual identity.", ttBasicPack: "Design of basic elements to professionally start your brand.", ttImpulse: "Quick strategy to increase your visibility in one month.", tt8Reels: "Recording and editing 8 short videos optimized for TikTok/Instagram.", ttRecording: "In-person photo and video session for 1 continuous hour.", ttConsulting: "Personalized digital guidance and structuring.", totalToBill: "Total to Bill (Initial Debt): ", btnLogout: "LOG OUT", btnSaveContinue: "SAVE AND CONTINUE", welcome: "Welcome,", company: "Company:", activeServices: "Active Services:", btnAccountStatement: "Account Statement", totalDebt: "Total Debt", paidAmount: "Paid (Approved)", pendingBalance: "Pending Balance", statusOverdue: "OVERDUE", reportPaymentTitle: "Report New Payment", lblPaymentMethod: "Payment Method *", optSelect: "Select...", optTransfer: "Bank Transfer (Bs)", optMobilePay: "Mobile Pay (Bs)", optCash: "Cash", optSelectBank: "Select Issuing Bank...", lblAmountBs: "Amount Paid (Bs) *", lblEuroRate: "Official Exchange Rate (Euro) *", lblEquivalentUsd: "Equivalent in Dollars ($)", lblEquivalentEur: "Equivalent in Euros (€)", lblAmountUsd: "Amount Paid ($) *", lblRefNum: "Reference Number *", lblTxDate: "Transaction Date *", btnSendReport: "SEND REPORT", historyTitle: "Issued Receipts History", thIndex: "#", thDate: "Date", thMethod: "Method", thRef: "Reference", thAmount: "Amount", thStatus: "Status", thAction: "Action", lblShow: "Show:", optAll: "All", noPayments: "No payments registered yet.", addServicesTitle: "Acquire Additional Services", addServicesDesc: "Do you want to add more value to your brand? Select extra services and generate a purchase order.", totalSelected: "Selected Total:", btnGenerateOrder: "Generate Order (PDF)", orderPdfTitle: "ADDITIONAL SERVICES ORDER", adminDesc: "Management of payments, validations, and users.", btnBackProfile: "Back to my profile", adminPendingTitle: "Pending Payments to Validate", adminPendingDesc: "Here are the payments reported by clients with 'Processing' status.", thClient: "Client / Company", thMethodRef: "Method / Ref", adminUsersTitle: "Registered Users Management", adminUsersDesc: "Manage accounts, edit profiles, assign delegates, or delete test users.", thName: "Name", thCompany: "Company / Brand", thEmail: "Email Address", loginTitle: "Sign In", tabLogin: "Login", tabRegister: "Create Account", btnEnter: "ENTER", orGoogle: "Or you can", btnGoogle: "Continue with Google", editUserTitle: "Edit User Profile", lblContactName: "Representative Name", lblCompanyName: "Company or Brand Name", lblIdNum: "ID / RIF", lblPhone: "Phone", lblAddress: "Full Address", btnSaveChanges: "SAVE CHANGES", clientReceiptsTitle: "Client Receipts", modalPlansTitle: "Social Media Management Plans", plan1Title: "Creative Plan", plan2Title: "Innovative Plan", plan3Title: "Vibes Plan", perMonth: "/mo", featBrandVision: "Brand vision planning", featSchedule: "Monthly content schedule", feat6Posts: "6 posts (designs & images)", feat8Posts: "8 posts (designs & images)", feat2Reels: "2 monthly reels", feat4Reels: "4 monthly reels", featStoriesLMV: "Stories M-W-F", featStoriesDaily: "Daily stories (M-F)", feat1Shoot: "1 Recording & photo session", feat2Shoots: "2 Recording & photo sessions", feat1Ad: "1 Ad (investment apart)", feat2Ads: "2 Ads (investment apart)", feat3Ads: "3 Ads (investment apart)", featStats: "Monthly statistics", btnChoosePlan: "CHOOSE PLAN", badgePopular: "Most Popular", modalDesignTitle: "Design & Visual Identity", designVisualDev: "Visual Development", designPacksSpecial: "Packs & Specials", btnChooseService: "CHOOSE SERVICE", modalQuoteTitle: "Custom Quote", quoteDesc: "Build your own package by selecting the services of interest.", lblEstimatedBudget: "Estimated Budget: ", placeholderQuoteMsg: "Any additional details or doubts for your business? (Optional)", btnSendQuote: "SEND QUOTE", totalVisits: "Total registered visits:", creditBalance: "Credit Balance", statusCredit: "IN FAVOR", adminTestimonialsTitle: "Real Testimonials Management", adminTestimonialsDesc: "Upload screenshots of real testimonials or messages from your clients to show them in the homepage carousel. We recommend using square or slightly vertical images.", lblClientName: "Client / Brand Name", lblClientImage: "Image (Screenshot or Photo)", btnUpload: "Upload", thImage: "Image"
    }
};

window.currentLang = localStorage.getItem('langPref') || 'es';

window.cambiarIdioma = function(lang) {
    window.currentLang = lang;
    localStorage.setItem('langPref', lang);
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if(translations[lang][key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translations[lang][key];
            } else {
                el.innerHTML = translations[lang][key];
            }
        }
    });
    document.getElementById('lang-selector').value = lang;
    if(window.currentUserId && document.getElementById('view-cliente').style.display === 'block'){
        window.renderTablaPagos();
    }
};

// ==================== LÓGICA DE TEMA ESCURO ====================
window.currentTheme = localStorage.getItem('themePref') || 'light';

window.toggleTheme = function() {
    if(window.currentTheme === 'light') {
        window.currentTheme = 'dark';
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('theme-icon').className = 'fas fa-sun';
    } else {
        window.currentTheme = 'light';
        document.body.removeAttribute('data-theme');
        document.getElementById('theme-icon').className = 'fas fa-moon';
    }
    localStorage.setItem('themePref', window.currentTheme);
};

if(window.currentTheme === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
    document.getElementById('theme-icon').className = 'fas fa-sun';
}
document.getElementById('lang-selector').value = window.currentLang;
window.cambiarIdioma(window.currentLang);

// ==================== LÓGICA DE ANALÍTICA E VISITAS ====================
window.seccionesVisitadas = ['Inicio'];
window.trackSection = function(sectionName) {
    if(!window.seccionesVisitadas.includes(sectionName)) {
        window.seccionesVisitadas.push(sectionName);
    }
};

window.registrarVisita = async function() {
    try {
        let ipData = {};
        try {
            const res = await fetch('https://ipapi.co/json/');
            if(res.ok) ipData = await res.json();
        } catch(e) { }

        const visitaData = {
            ip: ipData.ip || 'Oculta/Desconocida',
            pais: ipData.country_name || 'Desconocido',
            ciudad: ipData.city || 'Desconocida',
            zonaHoraria: ipData.timezone || 'Desconocida',
            fechaConexion: new Date().toISOString(),
            userAgent: navigator.userAgent,
            secciones: window.seccionesVisitadas,
            tiempoSegundos: 0,
            usuario: 'Anónimo'
        };

        const visitasRef = collection(db, 'analiticas_visitas');
        const newDoc = await addDoc(visitasRef, visitaData);
        const visitaId = newDoc.id;

        const globalRef = doc(db, 'analiticas_globales', 'contador');
        const globalSnap = await getDoc(globalRef);
        let totalVisitas = 1;
        
        if(globalSnap.exists()) {
            totalVisitas = (globalSnap.data().total || 0) + 1;
            await updateDoc(globalRef, { total: totalVisitas });
        } else {
            await setDoc(globalRef, { total: 1 });
        }
        
        const contadorEl = document.getElementById('contador-visitas-text');
        if(contadorEl) contadorEl.innerText = totalVisitas;

        let segundos = 0;
        setInterval(() => { segundos += 15; }, 15000);

        const updateAnalytics = async () => {
            try {
                const curUser = auth.currentUser ? auth.currentUser.email : 'Anónimo';
                await updateDoc(doc(db, 'analiticas_visitas', visitaId), {
                    tiempoSegundos: segundos,
                    secciones: window.seccionesVisitadas,
                    usuario: curUser
                });
            } catch(e) {}
        };

        setInterval(updateAnalytics, 30000);
        window.addEventListener('beforeunload', updateAnalytics);

    } catch(error) { }
};
window.registrarVisita();

// ==================== LÓGICA DE TASA DE CAMBIO (BCV) ====================
window.obtenerTasaBCV = async function() {
    const tasaInput = document.getElementById('pago-tasa');
    const tasaInfo = document.getElementById('pago-tasa-info');
    if(!tasaInput) return;
    try {
        const apiURL = atob('aHR0cHM6Ly9weWRvbGFydmVuZXp1ZWxhLWFwaS52ZXJjZWwuYXBwL2FwaS92MS9kb2xsYXIvcGFnZT9wYWdlPWJjdg==');
        const res = await fetch(apiURL);
        if(res.ok) {
            const data = await res.json();
            if(data && data.monitors && data.monitors.eur && data.monitors.eur.price) {
                tasaInput.value = parseFloat(data.monitors.eur.price).toFixed(2);
                tasaInfo.innerText = "(Tasa Euro Oficial BCV actualizada)";
                window.calcularConversionUsd();
                return;
            }
        }
    } catch(e) { }
    try {
        const apiURL2 = atob('aHR0cHM6Ly92ZS5kb2xhcmFwaS5jb20vdjEvZXVyb3Mvb2ZpY2lhbA==');
        const res2 = await fetch(apiURL2);
        if(res2.ok) {
            const data2 = await res2.json();
            if(data2 && data2.promedio) {
                tasaInput.value = parseFloat(data2.promedio).toFixed(2);
                tasaInfo.innerText = "(Tasa Euro Oficial BCV actualizada)";
                window.calcularConversionUsd();
            }
        }
    } catch(e) { 
        tasaInfo.innerText = "(Escriba la tasa manualmente)";
    }
};
window.obtenerTasaBCV();
setInterval(window.obtenerTasaBCV, 1800000);

// ==================== LÓGICA DE INACTIVIDADE E SESIÓN ====================
let inactivityTimer;
window.resetInactivityTimer = function() {
    clearTimeout(inactivityTimer);
    if (window.currentUserId && (document.getElementById('view-cliente').style.display === 'block' || document.getElementById('view-admin').style.display === 'block')) {
        inactivityTimer = setTimeout(() => {
            window.logout();
            alert(window.currentLang === 'es' ? "Sesión cerrada automáticamente por inactividad de 2 minutos." : "Session closed automatically due to 2 minutes of inactivity.");
        }, 120000); 
    }
};
window.addEventListener('mousemove', window.resetInactivityTimer);
window.addEventListener('keypress', window.resetInactivityTimer);
window.addEventListener('click', window.resetInactivityTimer);
window.addEventListener('scroll', window.resetInactivityTimer);

onAuthStateChanged(auth, async (user) => {
    if (user) {
        window.currentUserId = user.uid;
        window.userEmail = user.email;
        document.getElementById('reg-email').value = window.userEmail; 
        window.resetInactivityTimer();
        
        window.isDelegatedAdmin = false;
        if(window.userEmail === ADMIN_EMAIL) {
            window.isDelegatedAdmin = true;
        } else {
            try {
                const curDoc = await getDoc(doc(db, 'usuarios', window.currentUserId));
                if(curDoc.exists() && curDoc.data().role === 'admin') {
                    window.isDelegatedAdmin = true;
                }
            } catch(e) {}
        }

        if(window.isDelegatedAdmin) {
            document.getElementById('btn-admin-panel').style.display = 'inline-block';
        } else {
            document.getElementById('btn-admin-panel').style.display = 'none';
        }

        if (document.getElementById('view-cliente').style.display === 'block' || document.getElementById('modal-auth').style.display === 'block') {
            window.closeModal('modal-auth');
            document.getElementById('view-landing').style.display = 'none';
            document.getElementById('view-cliente').style.display = 'block';
            document.getElementById('social-sidebar').style.display = 'none';
            document.getElementById('whatsapp-float').style.display = 'none';
            window.checkUserProfile();
        }
    } else {
        window.currentUserId = null;
        window.userProfileData = null;
        window.isDelegatedAdmin = false;
        clearTimeout(inactivityTimer);
        document.getElementById('btn-admin-panel').style.display = 'none';
        window.showLanding();
    }
});



// Asegúrate de tener esta variable fuera de las funciones
let isLoginMode = true; 

window.toggleAuthMode = function() {
    isLoginMode = !isLoginMode;
    
    // Actualizar Títulos y Botones
    document.getElementById('auth-title').innerText = isLoginMode ? "¡Bienvenido!" : "Regístrate";
    document.getElementById('auth-subtitle').innerText = isLoginMode ? "Accede a tu espacio en Anyelina Digital" : "Forma parte de nuestra comunidad";
    document.getElementById('btn-auth-submit').innerText = isLoginMode ? "INICIAR SESIÓN" : "REGISTRARSE";
    
    // Cambiar texto de pie de página: Si es registro, cambiamos el texto
    const footerText = document.getElementById('auth-toggle-text');
    footerText.innerHTML = isLoginMode ? 
        '¿Aún no tienes cuenta? <a href="#" onclick="window.toggleAuthMode()">Regístrate aquí</a>' :
        '¿Ya tienes cuenta? <a href="#" onclick="window.toggleAuthMode()">Inicia sesión aquí</a>';
};

window.handleAuth = async function(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    try {
        if (isLoginMode) {
            await signInWithEmailAndPassword(auth, email, password);
            location.reload(); // Solo recarga si es inicio de sesión
        } else {
            await createUserWithEmailAndPassword(auth, email, password);
            // AQUÍ haces la redirección a la ventana que quieres, sin recargar
            window.closeModal('modal-auth'); // Cierra el modal
            window.showNextSection(); // Llama a tu función que muestra la siguiente ventana
        }
    } catch (error) {
        alert("Error: " + error.message);
    }
};





window.loginWithGoogle = async function() {
    const provider = new GoogleAuthProvider();
    try {
        document.getElementById('loading').style.display = 'flex';
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        const userRef = doc(db, 'usuarios', user.uid);
        const userDoc = await getDoc(userRef);

        if (window.authMode === 'login') {
            // VALIDACIÓN ESTRICTA DE BASE DE DATOS PARA GOOGLE
            if (!userDoc.exists() && user.email !== ADMIN_EMAIL) {
                await signOut(auth);
                throw { custom: true, message: window.currentLang === 'es' ? "Usuario no registrado en nuestra base de datos. Por favor, selecciona 'Crear Cuenta' primero." : "User not registered in our database. Please select 'Create Account' first." };
            }
        } else {
            // Modo Registro
            if (!userDoc.exists()) {
                await setDoc(userRef, {
                    email: user.email,
                    fechaRegistro: new Date().toISOString(),
                    role: 'user'
                });
            }
        }
    } catch(err) {
        document.getElementById('loading').style.display = 'none';
        if (err.custom) {
            document.getElementById('auth-error').innerText = err.message;
        } else {
            document.getElementById('auth-error').innerText = "Error Google Auth: " + err.message;
        }
    }
};

window.logout = async function() {
    await signOut(auth);
};


// ==================== LÓGICA DE PERFIL DE PAGOS CLIENTE ====================

window.prefillSetupForm = function(data) {
    if(data.nombre) document.getElementById('reg-nombre').value = data.nombre;
    if(data.empresa) document.getElementById('reg-empresa').value = data.empresa;
    if(data.cedula) document.getElementById('reg-cedula').value = data.cedula;
    if(data.telefono) document.getElementById('reg-telefono').value = data.telefono;
    if(data.direccion) document.getElementById('reg-direccion').value = data.direccion;
    
    if(data.planes && Array.isArray(data.planes)) {
        document.querySelectorAll('.plan-checkbox').forEach(cb => {
            if(data.planes.includes(cb.value)) {
                cb.checked = true;
            }
        });
        window.calcularTotal();
    }
};

window.checkUserProfile = async function() {
    if(!window.currentUserId) return;
    document.getElementById('loading').style.display = 'flex';
    
    const profileRef = doc(db, 'usuarios', window.currentUserId);
    
    try {
        const docSnap = await getDoc(profileRef);
        if (docSnap.exists()) {
            window.userProfileData = docSnap.data();
            
            if (!window.userProfileData.nombre || !window.userProfileData.empresa || !window.userProfileData.cedula || !window.userProfileData.telefono || !window.userProfileData.direccion) {
                alert(window.currentLang === 'es' ? "Por favor, completa los datos faltantes en tu perfil para continuar." : "Please complete your profile details to continue.");
                window.prefillSetupForm(window.userProfileData);
                document.getElementById('loading').style.display = 'none';
                document.getElementById('client-setup').style.display = 'block';
                document.getElementById('client-dashboard').style.display = 'none';
                return;
            }
            
            window.loadPayments(); 
        } else {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('client-setup').style.display = 'block';
            document.getElementById('client-dashboard').style.display = 'none';
        }
    } catch (error) {
        document.getElementById('loading').style.display = 'none';
    }
};

window.loadPayments = function() {
    const paymentsRef = collection(db, 'usuarios', window.currentUserId, 'pagos');
    
    onSnapshot(paymentsRef, (snapshot) => {
        window.userPaymentsData = [];
        let totalPagado = 0;

        snapshot.forEach((doc) => {
            const data = doc.data();
            data.id = doc.id;
            window.userPaymentsData.push(data);
            
            if(data.estatus === 'Aprobado') {
                totalPagado += parseFloat(data.monto);
            }
        });

        window.userPaymentsData.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        window.userProfileData.montoPagado = totalPagado;
        window.userProfileData.saldoPendiente = window.userProfileData.cuotaMensual - totalPagado;
        
        document.getElementById('loading').style.display = 'none';
        
        if(document.getElementById('view-cliente').style.display === 'block') {
            window.renderDashboard(); 
        }
    }, (error) => {
        document.getElementById('loading').style.display = 'none';
    });
};

const checkboxes = document.querySelectorAll('.plan-checkbox');
const totalDisplay = document.getElementById('reg-total');

window.calcularTotal = function() {
    window.calculoTotalDeuda = 0;
    checkboxes.forEach(cb => {
        if (cb.checked) {
            window.calculoTotalDeuda += parseFloat(cb.getAttribute('data-price'));
        }
    });
    totalDisplay.innerText = window.calculoTotalDeuda.toFixed(2);
};

checkboxes.forEach(cb => cb.addEventListener('change', window.calcularTotal));

window.handleProfileSetup = async function(e) {
    e.preventDefault();
    if(!window.currentUserId) return;

    document.getElementById('loading').style.display = 'flex';

    let planesSeleccionados = [];
    checkboxes.forEach(cb => {
        if(cb.checked) planesSeleccionados.push(cb.value);
    });

    const profileRef = doc(db, 'usuarios', window.currentUserId);
    
    let existingData = {};
    if (window.userProfileData) {
        existingData = window.userProfileData;
    } else {
        try {
            const docSnap = await getDoc(profileRef);
            if(docSnap.exists()) existingData = docSnap.data();
        } catch(err) {}
    }

    const newProfile = {
        nombre: document.getElementById('reg-nombre').value,
        email: window.userEmail, 
        empresa: document.getElementById('reg-empresa').value,
        cedula: document.getElementById('reg-cedula').value,
        telefono: document.getElementById('reg-telefono').value,
        direccion: document.getElementById('reg-direccion').value,
        planes: planesSeleccionados,
        role: existingData.role || 'user',
        fechaRegistro: existingData.fechaRegistro || new Date().toISOString()
    };

    newProfile.cuotaMensual = window.calculoTotalDeuda;
    newProfile.montoPagado = existingData.montoPagado || 0;
    newProfile.saldoPendiente = newProfile.cuotaMensual - newProfile.montoPagado;

    await setDoc(profileRef, newProfile, { merge: true });
    
    window.userProfileData = newProfile;
    window.loadPayments(); 
};

window.calcularTotalCotizacion = function() {
    let total = 0;
    document.querySelectorAll('.cot-checkbox').forEach(cb => {
        if (cb.checked) {
            total += parseFloat(cb.getAttribute('data-price'));
        }
    });
    const cotTotalDisplay = document.getElementById('cot-total');
    if(cotTotalDisplay) cotTotalDisplay.innerText = total.toFixed(2);
};

window.enviarCotizacion = function(e) {
    e.preventDefault();
    const nombre = document.getElementById('cot-nombre').value;
    const mensaje = document.getElementById('cot-mensaje').value;
    
    let seleccionados = [];
    document.querySelectorAll('.cot-checkbox').forEach(cb => {
        if (cb.checked) seleccionados.push(cb.value);
    });
    
    const total = document.getElementById('cot-total').innerText;
    
    let textoWp = `*NUEVA SOLICITUD DE COTIZACIÓN*\n\nHola Anyelina, soy *${nombre}*.\nEstoy interesado/a en cotizar los siguientes servicios:\n\n`;
    
    if(seleccionados.length > 0) {
        seleccionados.forEach(s => textoWp += `✅ ${s}\n`);
        textoWp += `\n*Presupuesto Estimado:* $${total}\n\n`;
    } else {
        textoWp += `(No se seleccionaron paquetes predefinidos)\n\n`;
    }
    
    if(mensaje) {
        textoWp += `*Detalles adicionales/Dudas:*\n"${mensaje}"\n\n`;
    }

    window.open(atob('aHR0cHM6Ly93YS5tZS81ODQxMjAyNTM5NTU/dGV4dD0=') + encodeURIComponent(textoWp), '_blank');
    window.closeModal('modal-cotizar');
    e.target.reset();
    window.calcularTotalCotizacion(); 
};

window.calcularConversionUsd = function() {
    const bs = parseFloat(document.getElementById('pago-monto-bs').value) || 0;
    const tasa = parseFloat(document.getElementById('pago-tasa').value) || 1;
    const usd = bs / tasa;
    document.getElementById('pago-monto-usd-calc').value = usd.toFixed(2);
};
document.getElementById('pago-monto-bs').addEventListener('input', window.calcularConversionUsd);
document.getElementById('pago-tasa').addEventListener('input', window.calcularConversionUsd);

window.togglePaymentFields = function() {
    const metodo = document.getElementById('pago-metodo').value;
    const container = document.getElementById('dynamic-payment-fields');
    const banco = document.getElementById('pago-banco');
    const cedula = document.getElementById('pago-cedula');
    const cuenta = document.getElementById('pago-cuenta');
    
    const contBs = document.getElementById('currency-fields-bs');
    const contUsd = document.getElementById('currency-fields-usd');
    
    const refContainer = document.getElementById('container-pago-ref');
    const refInput = document.getElementById('pago-ref');

    banco.style.display = 'none'; cedula.style.display = 'none'; cuenta.style.display = 'none';
    banco.required = false; cedula.required = false; cuenta.required = false;
    
    cuenta.removeAttribute('pattern');
    cuenta.removeAttribute('title');
    cuenta.onblur = null;
    cuenta.oninput = null;
    cuenta.setCustomValidity("");
    
    if (metodo === 'Efectivo') {
        refContainer.style.display = 'none';
        refInput.required = false;
        refInput.value = 'N/A';
    } else {
        refContainer.style.display = 'block';
        refInput.required = true;
        if(refInput.value === 'N/A') refInput.value = '';
    }

    if (!metodo) {
        container.style.display = 'none';
        contBs.style.display = 'none';
        contUsd.style.display = 'block';
        return;
    }

    if (metodo === 'Transferencia Bancaria' || metodo === 'Pago Movil') {
        contBs.style.display = 'block';
        contUsd.style.display = 'none';
        document.getElementById('pago-monto-bs').required = true;
        document.getElementById('pago-tasa').required = true;
        document.getElementById('pago-monto-usd-direct').required = false;
    } else {
        contBs.style.display = 'none';
        contUsd.style.display = 'block';
        document.getElementById('pago-monto-bs').required = false;
        document.getElementById('pago-tasa').required = false;
        document.getElementById('pago-monto-usd-direct').required = true;
    }

    if (metodo === 'Efectivo') {
        container.style.display = 'none';
    } else {
        container.style.display = 'block';
        
        if (metodo === 'Transferencia Bancaria') {
            banco.style.display = 'block'; banco.required = true;
            cedula.style.display = 'block'; cedula.required = true;
        } 
        else if (metodo === 'Pago Movil') {
            banco.style.display = 'block'; banco.required = true;
            cedula.style.display = 'block'; cedula.required = true;
            cuenta.style.display = 'block'; cuenta.required = true;
            cuenta.type = 'tel';
            cuenta.placeholder = "Teléfono de Origen";
        } 
        else if (metodo === 'Zelle' || metodo === 'Zinli') {
            cuenta.style.display = 'block';
            cuenta.required = true;
            cuenta.type = 'text'; 
            cuenta.placeholder = "Correo electrónico asociado a " + metodo;
            cuenta.onblur = function() {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if(this.value && !emailRegex.test(this.value)) {
                    this.setCustomValidity("Formato inválido. Ingrese un correo completo (ej: usuario@correo.com)");
                    this.reportValidity();
                } else {
                    this.setCustomValidity("");
                }
            };
            cuenta.oninput = function() { this.setCustomValidity(""); };
        }
        else if (metodo === 'Wally') {
            cuenta.style.display = 'block';
            cuenta.required = true;
            cuenta.type = 'tel'; 
            cuenta.placeholder = "Número de teléfono registrado en Wally";
        }
        else if (metodo === 'Binance') {
            cuenta.style.display = 'block';
            cuenta.required = true;
            cuenta.type = 'text';
            cuenta.placeholder = "Correo o ID de Binance (Pay ID)";
        }
    }
};

window.handlePaymentSubmit = async function(e) {
    e.preventDefault();
    if(!window.currentUserId || !window.userProfileData) return;

    const metodo = document.getElementById('pago-metodo').value;
    const cuentaOrigenVal = document.getElementById('pago-cuenta').value;
    const bancoOrigen = document.getElementById('pago-banco').value;
    const cedulaOrigen = document.getElementById('pago-cedula').value;
    
    if ((metodo === 'Zelle' || metodo === 'Zinli') && cuentaOrigenVal) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cuentaOrigenVal)) {
            alert("Por favor, ingrese un correo electrónico válido completo (ejemplo: usuario@correo.com). El formato ingresado es incorrecto.");
            return; 
        }
    }

    const referencia = document.getElementById('pago-ref').value.trim();

    if (metodo !== 'Efectivo') {
        const referenciaDuplicada = window.userPaymentsData.some(p => p.referencia.toLowerCase() === referencia.toLowerCase() && p.referencia !== 'N/A');
        if (referenciaDuplicada) {
            const refInput = document.getElementById('pago-ref');
            refInput.setCustomValidity("Esta referencia ya se encuentra registrada en su historial.");
            refInput.reportValidity();
            refInput.oninput = function() { this.setCustomValidity(""); };
            return; 
        }
    }

    const btn = e.target.querySelector('button');
    btn.innerHTML = "Procesando..."; btn.disabled = true;

    const fecha = document.getElementById('pago-fecha').value;
    
    let finalMonto = 0;
    let montoBs = 0;
    let tasaCambio = 0;

    if (metodo === 'Transferencia Bancaria' || metodo === 'Pago Movil') {
        montoBs = parseFloat(document.getElementById('pago-monto-bs').value) || 0;
        tasaCambio = parseFloat(parseFloat(document.getElementById('pago-tasa').value).toFixed(2)) || 1;
        finalMonto = montoBs / tasaCambio;
    } else {
        finalMonto = parseFloat(document.getElementById('pago-monto-usd-direct').value) || 0;
    }

    const nuevoPago = {
        metodo: metodo,
        referencia: referencia,
        monto: finalMonto,
        montoBs: montoBs,
        tasaCambio: tasaCambio,
        fecha: fecha,
        bancoOrigen: bancoOrigen || "",
        cedulaOrigen: cedulaOrigen || "",
        cuentaOrigen: cuentaOrigenVal || "",
        estatus: "Procesando", 
        timestamp: new Date().toISOString()
    };

    const paymentsRef = collection(db, 'usuarios', window.currentUserId, 'pagos');
    await addDoc(paymentsRef, nuevoPago);

    e.target.reset();
    window.togglePaymentFields(); 
    btn.innerHTML = translations[window.currentLang].btnSendReport; btn.disabled = false;

    const clientName = window.userProfileData.nombre;
    const clientCompany = window.userProfileData.empresa;
    const clientCedula = window.userProfileData.cedula || 'N/D';
    const clientPhone = window.userProfileData.telefono || 'N/D';
    const clientEmail = window.userProfileData.email || 'N/D';
    
    let detallesExtra = "";
    if(bancoOrigen) detallesExtra += `🏦 Banco Origen: ${bancoOrigen}\n`;
    if(cuentaOrigenVal) detallesExtra += `✉️ / 🆔 Origen: ${cuentaOrigenVal}\n`;
    if(cedulaOrigen) detallesExtra += `🪪 Cédula Origen: ${cedulaOrigen}\n`;

    let symbol = (metodo === 'Transferencia Bancaria' || metodo === 'Pago Movil') ? '€' : '$';
    let cashEmoji = symbol === '€' ? '💶' : '💵';

    const wpText = `*NUEVO PAGO REGISTRADO*\n\n*Datos del Cliente:*\n👤 Nombre: ${clientName}\n🏢 Empresa: ${clientCompany}\n📄 Cédula/RIF: ${clientCedula}\n📞 Teléfono: ${clientPhone}\n📧 Correo: ${clientEmail}\n\n*Detalles del Pago:*\n💳 Método: ${metodo}\n${detallesExtra}${cashEmoji} Monto Estimado: ${symbol}${finalMonto.toFixed(2)}\n🏦 Monto (Bs): Bs ${montoBs.toFixed(2)} (Tasa: ${tasaCambio.toFixed(2)})\n📝 Referencia: ${referencia}\n📅 Fecha: ${fecha}\n\n*Estatus:* Procesando`;
    
    if(confirm("¿Deseas notificar el pago via Whatsapp?")) {
        window.open(atob('aHR0cHM6Ly93YS5tZS81ODQxMjAyNTM5NTU/dGV4dD0=') + encodeURIComponent(wpText), '_blank');
    }

    const emailSubject = `Nuevo Pago Registrado - ${clientCompany}`;
    const emailBody = `Se ha registrado un nuevo pago en la plataforma.\n\nDatos del Cliente:\nNombre: ${clientName}\nEmpresa: ${clientCompany}\nCédula/RIF: ${clientCedula}\nTeléfono: ${clientPhone}\nCorreo: ${clientEmail}\n\nDetalles del Pago:\nMétodo: ${metodo}\nMonto Equivalente: ${symbol}${finalMonto.toFixed(2)}\nMonto (Bs): Bs ${montoBs.toFixed(2)} (Tasa: ${tasaCambio.toFixed(2)})\nReferencia: ${referencia}\nFecha: ${fecha}\n\nEstatus: Procesando. Verifique su módulo administrativo.`;
    
    setTimeout(() => {
        window.open(atob('bWFpbHRvOmRpZ2l0YWx2aWJlcy52ZUBnbWFpbC5jb20/c3ViamVjdD0=') + encodeURIComponent(emailSubject) + '&body=' + encodeURIComponent(emailBody), '_blank');
    }, 800);
};

window.showLanding = function() {
    document.getElementById('view-landing').style.display = 'block';
    document.getElementById('view-cliente').style.display = 'none';
    document.getElementById('view-admin').style.display = 'none';
    document.getElementById('social-sidebar').style.display = 'flex';
    document.getElementById('whatsapp-float').style.display = 'flex';
};

window.showClientArea = function() {
    if (!window.currentUserId) {
        window.openModal('modal-auth');
    } else {
        document.getElementById('view-landing').style.display = 'none';
        document.getElementById('view-admin').style.display = 'none';
        document.getElementById('view-cliente').style.display = 'block';
        document.getElementById('social-sidebar').style.display = 'none';
        document.getElementById('whatsapp-float').style.display = 'none';
        window.checkUserProfile();
    }
};

window.showAdminArea = async function() {
    if (!window.isDelegatedAdmin) {
        alert("Acceso denegado.");
        return;
    }
    document.getElementById('view-landing').style.display = 'none';
    document.getElementById('view-cliente').style.display = 'none';
    document.getElementById('view-admin').style.display = 'block';
    document.getElementById('social-sidebar').style.display = 'none';
    document.getElementById('whatsapp-float').style.display = 'none';
    
    document.getElementById('loading').style.display = 'flex';
    try {
        await window.loadAdminPayments();
        await window.loadAdminUsers();
        if(window.loadAdminTestimonios) await window.loadAdminTestimonios(); 
    } catch(e) {
        console.error("Error cargando panel admin:", e);
        const tbody = document.querySelector('#admin-payments-table tbody');
        if(tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Error de conexión. Intente novamente.</td></tr>';
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
};

// ==================== LÓGICA PARA USUARIOS ADMIN ====================
window.allAdminUsersData = [];

window.loadAdminPayments = async function() {
    try {
        const tbody = document.querySelector('#admin-payments-table tbody');
        if(!tbody) return;
        tbody.innerHTML = '';
        
        const usersSnap = await getDocs(collection(db, 'usuarios'));
        let allPayments = [];
        
        for (const userDoc of usersSnap.docs) {
            const userData = userDoc.data();
            const pagosSnap = await getDocs(collection(db, 'usuarios', userDoc.id, 'pagos'));
            
            pagosSnap.forEach(pagoDoc => {
                const p = pagoDoc.data();
                p.pagoId = pagoDoc.id;
                p.userId = userDoc.id;
                p.clienteNombre = userData.nombre || 'N/D';
                p.clienteEmpresa = userData.empresa || 'N/D';
                allPayments.push(p);
            });
        }

        allPayments.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

        let pendingPayments = allPayments.filter(p => p.estatus === 'Procesando');

        if(pendingPayments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay pagos pendientes.</td></tr>';
        }

        pendingPayments.forEach(pago => {
            const tr = document.createElement('tr');
            const badgeClass = 'status-procesando';
            let symbol = (pago.metodo === 'Transferencia Bancaria' || pago.metodo === 'Pago Movil') ? '€' : '$';

            let actionBtn = `<div style="display:flex; gap:5px; flex-wrap:wrap;">`;
            actionBtn += `<button class="btn-main btn-sm" onclick="window.aprobarPago('${pago.userId}', '${pago.pagoId}')" style="background: #28a745;" title="Aprobar"><i class="fas fa-check"></i></button>`;
            actionBtn += `<button class="btn-main btn-sm" onclick="window.adminDescargarEstadoCuenta('${pago.userId}')" style="background: #17a2b8;" title="Estado de Cuenta"><i class="fas fa-file-invoice-dollar"></i></button>`;
            actionBtn += `<button class="btn-main btn-sm" onclick="window.adminVerRecibos('${pago.userId}')" style="background: #6c757d;" title="Ver Recibos"><i class="fas fa-receipt"></i></button>`;
            actionBtn += `</div>`;

            tr.innerHTML = `
                <td><strong>${pago.clienteEmpresa}</strong><br><span style="font-size:0.8rem; color:#666;">${pago.clienteNombre}</span></td>
                <td>${pago.fecha}</td>
                <td>${pago.metodo}<br><span style="font-size:0.8rem; color:#666;">Ref: ${pago.referencia}</span></td>
                <td style="font-weight:bold; color:var(--brand-pink);">${symbol}${pago.monto.toFixed(2)}</td>
                <td><span class="status-badge ${badgeClass}">${pago.estatus}</span></td>
                <td>${actionBtn}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error en loadAdminPayments:", error);
        const tbody = document.querySelector('#admin-payments-table tbody');
        if(tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Error cargando pagos. Verifique permisos.</td></tr>';
    }
};

window.loadAdminUsers = async function() {
    try {
        const usersSnap = await getDocs(collection(db, 'usuarios'));
        let users = [];
        
        usersSnap.forEach(docSnap => {
            let u = docSnap.data();
            u.id = docSnap.id;
            users.push(u);
        });
        
        users.sort((a, b) => {
            if (a.role === 'admin' && b.role !== 'admin') return -1;
            if (a.role !== 'admin' && b.role === 'admin') return 1;
            return new Date(b.fechaRegistro || 0) - new Date(a.fechaRegistro || 0);
        });
        
        window.allAdminUsersData = users;
        window.renderAdminUsers();
    } catch (error) {
        console.error("Error en loadAdminUsers:", error);
        const tbody = document.querySelector('#admin-users-table tbody');
        if(tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Error cargando usuarios. Verifique permisos.</td></tr>';
    }
};

window.renderAdminUsers = function() {
    const tbody = document.querySelector('#admin-users-table tbody');
    tbody.innerHTML = '';
    
    const searchTerm = (document.getElementById('admin-user-search').value || '').toLowerCase();
    
    let filteredUsers = window.allAdminUsersData.filter(u => 
        (u.nombre && String(u.nombre).toLowerCase().includes(searchTerm)) ||
        (u.empresa && String(u.empresa).toLowerCase().includes(searchTerm)) ||
        (u.email && String(u.email).toLowerCase().includes(searchTerm)) ||
        (u.cedula && String(u.cedula).toLowerCase().includes(searchTerm)) ||
        (u.telefono && String(u.telefono).toLowerCase().includes(searchTerm))
    );
    
    let usersToShow = filteredUsers.slice(0, 5);
    
    if(usersToShow.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No se encontraron usuarios.</td></tr>';
        return;
    }
    
    usersToShow.forEach(u => {
        const tr = document.createElement('tr');
        const starColor = (u.role === 'admin') ? 'gold' : 'white';
        const starTitle = (u.role === 'admin') ? 'Remover Admin' : 'Hacer Admin';
        
        tr.innerHTML = `
            <td><strong>${u.nombre}</strong></td>
            <td>${u.empresa}</td>
            <td>${u.email}</td>
            <td>
                <div style="display:flex; gap:5px; flex-wrap:wrap;">
                    <button class="btn-main btn-sm" style="background-color: #17a2b8;" onclick="window.adminDescargarEstadoCuenta('${u.id}')" title="Estado de Cuenta"><i class="fas fa-file-invoice-dollar"></i></button>
                    <button class="btn-main btn-sm" style="background-color: #6c757d;" onclick="window.adminVerRecibos('${u.id}')" title="Ver Recibos"><i class="fas fa-receipt"></i></button>
                    <button class="btn-main btn-sm" style="background-color: #ffc107; color:#333;" onclick="window.abrirEdicionUsuario('${u.id}')" title="Editar Perfil"><i class="fas fa-pen"></i></button>
                    <button class="btn-main btn-sm" style="background-color: #007bff; color:${starColor};" onclick="window.toggleAdminRole('${u.id}', '${u.role || 'user'}')" title="${starTitle}"><i class="fas fa-star"></i></button>
                    <button class="btn-main btn-sm" style="background-color: #dc3545;" onclick="window.eliminarUsuario('${u.id}', '${u.nombre}')" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

window.toggleAdminRole = async function(userId, currentRole) {
    if(window.userEmail !== ADMIN_EMAIL) {
        alert("Solo la propietaria principal puede delegar accesos.");
        return;
    }
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if(confirm(`¿Deseas cambiar el rol de este usuario a: ${newRole.toUpperCase()}?`)) {
        document.getElementById('loading').style.display = 'flex';
        try {
            await updateDoc(doc(db, 'usuarios', userId), { role: newRole });
            await window.loadAdminUsers();
        } catch(e) {
            alert('Error cambiando rol.');
        }
        document.getElementById('loading').style.display = 'none';
    }
};

window.abrirEdicionUsuario = async function(userId) {
    document.getElementById('loading').style.display = 'flex';
    try {
        const userDoc = await getDoc(doc(db, 'usuarios', userId));
        if(userDoc.exists()) {
            const data = userDoc.data();
            document.getElementById('edit-uid').value = userId;
            document.getElementById('edit-nombre').value = data.nombre || '';
            document.getElementById('edit-empresa').value = data.empresa || '';
            document.getElementById('edit-cedula').value = data.cedula || '';
            document.getElementById('edit-telefono').value = data.telefono || '';
            document.getElementById('edit-direccion').value = data.direccion || '';
            
            const todosLosPlanes = [
                "Plan Creativo", "Plan Innovador", "Plan Vibes",
                "Plan Creativo Contenido", "Plan Innovador Contenido", "Plan Vibes Contenido",
                "Identidad Completa", "Rebranding", "Pack Básico",
                "Pack Impulso", "Pack 8 Reels", "Pauta Grabación 1h", "Asesoría 1:1"
            ];
            const planesUsuario = data.planes || [];
            const planesContainer = document.getElementById('edit-planes-container');
            planesContainer.innerHTML = '';
            todosLosPlanes.forEach(plan => {
                const isChecked = planesUsuario.includes(plan) ? 'checked' : '';
                planesContainer.innerHTML += `
                    <label style="font-size: 0.85rem; display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" class="admin-edit-plan-cb" value="${plan}" ${isChecked}> ${plan}
                    </label>
                `;
            });

            window.openModal('modal-edit-user');
        }
    } catch(e) {
        alert('Error al obtener datos del usuario.');
    }
    document.getElementById('loading').style.display = 'none';
};

window.guardarEdicionUsuario = async function(e) {
    e.preventDefault();
    document.getElementById('loading').style.display = 'flex';
    const userId = document.getElementById('edit-uid').value;
    try {
        let novosPlanes = [];
        document.querySelectorAll('.admin-edit-plan-cb').forEach(cb => {
            if (cb.checked) novosPlanes.push(cb.value);
        });

        const precios = {
            "Plan Creativo": 140, "Plan Innovador": 165, "Plan Vibes": 200,
            "Plan Creativo Contenido": 120, "Plan Innovador Contenido": 135, "Plan Vibes Contenido": 150,
            "Identidad Completa": 220, "Rebranding": 110, "Pack Básico": 75,
            "Pack Impulso": 35, "Pack 8 Reels": 100, "Pauta Grabación 1h": 35, "Asesoría 1:1": 25
        };
        
        let novaCuota = 0;
        novosPlanes.forEach(p => { if(precios[p]) novaCuota += precios[p]; });

        const userRef = doc(db, 'usuarios', userId);
        const userDoc = await getDoc(userRef);
        let montoPagado = 0;
        if(userDoc.exists() && userDoc.data().montoPagado) {
            montoPagado = userDoc.data().montoPagado;
        }
        let saldoPendiente = novaCuota - montoPagado;

        await updateDoc(userRef, {
            nombre: document.getElementById('edit-nombre').value,
            empresa: document.getElementById('edit-empresa').value,
            cedula: document.getElementById('edit-cedula').value,
            telefono: document.getElementById('edit-telefono').value,
            direccion: document.getElementById('edit-direccion').value,
            planes: novosPlanes,
            cuotaMensual: novaCuota,
            saldoPendiente: saldoPendiente
        });
        window.closeModal('modal-edit-user');
        await window.loadAdminUsers();
        
        if(userId === window.currentUserId) {
            window.checkUserProfile();
        }

        alert('Perfil actualizado correctamente.');
    } catch(e) {
        alert('Error al guardar cambios.');
    }
    document.getElementById('loading').style.display = 'none';
};

window.aprobarPago = async function(userId, pagoId) {
    if(confirm("¿Estás segura de que deseas aprobar este pago y descontarlo de la deuda del cliente?")) {
        document.getElementById('loading').style.display = 'flex';
        try {
            const pagoRef = doc(db, 'usuarios', userId, 'pagos', pagoId);
            await updateDoc(pagoRef, { estatus: 'Aprobado' });
            await window.loadAdminPayments();
        } catch(e) {
            alert("Error al aprobar pago.");
            document.getElementById('loading').style.display = 'none';
        }
    }
};

window.eliminarUsuario = async function(userId, userName) {
    if(confirm(`¿Estás segura de que deseas ELIMINAR COMPLETAMENTE al usuario "${userName}" y todos sus pagos registrados? Esta acción no se puede deshacer.`)) {
        document.getElementById('loading').style.display = 'flex';
        try {
            const pagosSnap = await getDocs(collection(db, 'usuarios', userId, 'pagos'));
            const deletePromises = [];
            pagosSnap.forEach(pagoDoc => {
                deletePromises.push(deleteDoc(doc(db, 'usuarios', userId, 'pagos', pagoDoc.id)));
            });
            await Promise.all(deletePromises);

            await deleteDoc(doc(db, 'usuarios', userId));

            await window.loadAdminUsers();
            await window.loadAdminPayments();
            
            alert(`Usuario "${userName}" y todos sus registros eliminados correctamente.`);
        } catch (e) {
            alert("Error al eliminar el usuario.");
        } finally {
            document.getElementById('loading').style.display = 'none';
        }
    }
};


import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

window.recuperarPassword = async function() {
    const email = document.getElementById('auth-email').value;
    
    if (!email) {
        alert("Por favor, ingresa tu correo electrónico primero para recuperar la contraseña.");
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        alert("Se ha enviado un enlace de recuperación a tu correo electrónico. Revisa tu bandeja de entrada o spam.");
    } catch (error) {
        alert("Error: " + error.message);
    }
};


window.adminDescargarEstadoCuenta = async function(userId) {
    document.getElementById('loading').style.display = 'flex';
    try {
        const userDoc = await getDoc(doc(db, 'usuarios', userId));
        if(userDoc.exists()) {
            const userData = userDoc.data();
            const pagosSnap = await getDocs(collection(db, 'usuarios', userId, 'pagos'));
            let totalPagado = 0;
            pagosSnap.forEach(p => {
                if(p.data().estatus === 'Aprobado') totalPagado += parseFloat(p.data().monto);
            });
            
            userData.montoPagado = totalPagado;
            userData.saldoPendiente = userData.cuotaMensual - totalPagado;
            
            window.generarEstadoCuentaPDFBase(userData);
        }
    } catch(e) {
        alert('Error al generar estado de cuenta del cliente.');
    }
    document.getElementById('loading').style.display = 'none';
};

window.adminVerRecibos = async function(userId) {
    document.getElementById('loading').style.display = 'flex';
    try {
        const userDoc = await getDoc(doc(db, 'usuarios', userId));
        const userData = userDoc.data();
        
        document.getElementById('admin-recibos-cliente-nombre').innerText = userData.empresa + " (" + userData.nombre + ")";
        
        const pagosSnap = await getDocs(collection(db, 'usuarios', userId, 'pagos'));
        let pagos = [];
        pagosSnap.forEach(p => {
            let d = p.data();
            d.id = p.id;
            pagos.push(d);
        });
        pagos.sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
        
        const tbody = document.querySelector('#admin-recibos-table tbody');
        tbody.innerHTML = '';
        
        if(pagos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay recibos registrados para este cliente.</td></tr>';
        } else {
            pagos.forEach(pago => {
                const tr = document.createElement('tr');
                const badgeClass = pago.estatus === 'Aprobado' ? 'status-aprobado' : 'status-procesando';
                let symbol = (pago.metodo === 'Transferencia Bancaria' || pago.metodo === 'Pago Movil') ? '€' : '$';

                const btnAction = `<button type="button" class="btn-main btn-sm" onclick='window.imprimirReciboAdmin(${JSON.stringify(pago).replace(/'/g, "&apos;")}, ${JSON.stringify(userData).replace(/'/g, "&apos;")})' style="background:#333;" title="Imprimir PDF"><i class="fas fa-file-pdf"></i> Imprimir</button>`;
                
                tr.innerHTML = `
                    <td>${pago.fecha}</td>
                    <td>${pago.metodo}</td>
                    <td>${pago.referencia}</td>
                    <td style="font-weight:bold;">${symbol}${pago.monto.toFixed(2)}</td>
                    <td><span class="status-badge ${badgeClass}">${pago.estatus}</span></td>
                    <td>${btnAction}</td>
                `;
                tbody.appendChild(tr);
            });
        }
        window.openModal('modal-admin-recibos');
    } catch(e) {
        console.error(e);
    }
    document.getElementById('loading').style.display = 'none';
};

window.imprimirReciboAdmin = function(pago, userData) {
    window.descargarReciboPDF(pago, userData);
};

window.descargarEstadoCuentaPDF = function() {
    if(window.userProfileData) {
        window.generarEstadoCuentaPDFBase(window.userProfileData);
    }
    return false;
};

// ==================== LÓGICA PARA GENERACIÓN DE PDFs Y NÚMEROS A LETRAS ====================
window.NumeroALetras = function(num, isEuro = false) {
    function Unidades(num) {
        switch(num) {
            case 1: return 'UN'; case 2: return 'DOS'; case 3: return 'TRES'; case 4: return 'CUATRO'; case 5: return 'CINCO';
            case 6: return 'SEIS'; case 7: return 'SIETE'; case 8: return 'OCHO'; case 9: return 'NUEVE';
        }
        return '';
    }
    function Decenas(num) {
        let decena = Math.floor(num/10);
        let unidad = num - (decena * 10);
        switch(decena) {
            case 1:
                switch(unidad) {
                    case 0: return 'DIEZ'; case 1: return 'ONCE'; case 2: return 'DOCE'; case 3: return 'TRECE';
                    case 4: return 'CATORCE'; case 5: return 'QUINCE'; default: return 'DIECI' + Unidades(unidad);
                }
            case 2:
                switch(unidad) {
                    case 0: return 'VEINTE'; default: return 'VEINTI' + Unidades(unidad);
                }
            case 3: return DecenasY('TREINTA', unidad); case 4: return DecenasY('CUARENTA', unidad); case 5: return DecenasY('CINCUENTA', unidad);
            case 6: return DecenasY('SESENTA', unidad); case 7: return DecenasY('SETENTA', unidad); case 8: return DecenasY('OCHENTA', unidad);
            case 9: return DecenasY('NOVENTA', unidad); case 0: return Unidades(unidad);
        }
    }
    function DecenasY(strSin, numUnidades) {
        if (numUnidades > 0) return strSin + ' Y ' + Unidades(numUnidades);
        return strSin;
    }
    function Centenas(num) {
        let centenas = Math.floor(num / 100);
        let decenas = num - (centenas * 100);
        switch(centenas){
            case 1: if (decenas > 0) return 'CIENTO ' + Decenas(decenas); return 'CIEN';
            case 2: return 'DOSCIENTOS ' + Decenas(decenas); case 3: return 'TRESCIENTOS ' + Decenas(decenas); case 4: return 'CUATROCIENTOS ' + Decenas(decenas);
            case 5: return 'QUINIENTOS ' + Decenas(decenas); case 6: return 'SEISCIENTOS ' + Decenas(decenas); case 7: return 'SETECIENTOS ' + Decenas(decenas);
            case 8: return 'OCHOCIENTOS ' + Decenas(decenas); case 9: return 'NOVECIENTOS ' + Decenas(decenas);
        }
        return Decenas(decenas);
    }
    function Seccion(num, divisor, strSingular, strPlural) {
        let cientos = Math.floor(num / divisor);
        let resto = num - (cientos * divisor);
        let letras = '';
        if (cientos > 0) {
            if (cientos > 1) letras = Centenas(cientos) + ' ' + strPlural;
            else letras = strSingular;
        }
        if (resto > 0) letras += '';
        return letras;
    }
    function Miles(num) {
        let divisor = 1000; let cientos = Math.floor(num / divisor); let resto = num - (cientos * divisor);
        let strMiles = Seccion(num, divisor, 'UN MIL', 'MIL'); let strCentenas = Centenas(resto);
        if(strMiles === '') return strCentenas;
        return strMiles + (strCentenas ? ' ' + strCentenas : '');
    }
    function Millones(num) {
        let divisor = 1000000; let cientos = Math.floor(num / divisor); let resto = num - (cientos * divisor);
        let strMillones = Seccion(num, divisor, 'UN MILLON', 'MILLONES'); let strMiles = Miles(resto);
        if(strMillones === '') return strMiles;
        return strMillones + (strMiles ? ' ' + strMiles : '');
    }
    
    let enteros = Math.floor(num);
    let centavos = Math.round((num - enteros) * 100);
    let monedaPlural = isEuro ? 'EUROS' : 'DÓLARES';
    let monedaSingular = isEuro ? 'EURO' : 'DÓLAR';
    let centimosPlural = isEuro ? 'CÉNTIMOS' : 'CENTAVOS';
    let letrasCentavos = centavos === 1 ? 'UN ' + (isEuro ? 'CÉNTIMO' : 'CENTAVO') : (centavos === 0 ? 'CERO ' + centimosPlural : Millones(centavos) + ' ' + centimosPlural);
    if (enteros === 0) return 'CERO ' + monedaPlural + ' CON ' + letrasCentavos;
    if (enteros === 1) return 'UN ' + monedaSingular + ' CON ' + letrasCentavos;
    return Millones(enteros) + ' ' + monedaPlural + ' CON ' + letrasCentavos;
};

window.generarEstadoCuentaPDFBase = function(profile) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF(); 

    try { const logo = document.querySelector('.logo-img'); if(logo) { doc.addImage(logo, 'PNG', 20, 15, 35, 12); } } catch(e) {}

    doc.setTextColor(50, 50, 50); doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text("Anyelina V. Tiapa B.", 190, 18, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    doc.text("RIF: V324874344", 190, 23, { align: "right" }); 
    doc.text("Calle 175, Edif Parque Residencial Guaparo Norte", 190, 27, { align: "right" });
    doc.text("Torre 3, Piso 12, APT 3124, Sector La Granja", 190, 31, { align: "right" });
    doc.text("Naguanagua, Edo. Carabobo", 190, 35, { align: "right" });

    doc.setTextColor(209, 77, 156); doc.setFontSize(16); doc.setFont("helvetica", "bold");
    const isEn = window.currentLang === 'en';
    doc.text(isEn ? "ACCOUNT STATEMENT" : "ESTADO DE CUENTA", 20, 45);
    doc.setDrawColor(209, 77, 156); doc.setLineWidth(0.5); doc.line(20, 48, 190, 48); 

    doc.setTextColor(50, 50, 50); doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text(isEn ? "Client Information:" : "Información del Cliente:", 20, 58);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.text(`${isEn ? "Company / Brand" : "Empresa / Marca"}: ${profile.empresa}`, 20, 65);
    doc.text(`${isEn ? "Representative" : "Representante"}: ${profile.nombre}`, 20, 71);
    doc.text(`Cédula / RIF: ${profile.cedula || 'N/D'}`, 20, 77);
    doc.text(`${isEn ? "Phone" : "Teléfono"}: ${profile.telefono || 'N/D'}`, 20, 83);
    doc.text(`${isEn ? "Email" : "Correo"}: ${profile.email}`, 20, 89);
    doc.text(`${isEn ? "Address" : "Dirección"}: ${profile.direccion || 'N/D'}`, 20, 95);
    
    doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text(isEn ? "Document Details:" : "Datos del Documento:", 120, 58);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.text(`Control N°: EC-${Date.now().toString().slice(-6)}`, 120, 65);
    doc.text(`${isEn ? "Issue Date" : "Fecha de Emisión"}: ${new Date().toLocaleDateString('es-VE')}`, 120, 71);

    doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text(isEn ? "Contracted Services:" : "Servicios Contratados:", 20, 115);
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    
    let y = 122;
    profile.planes.forEach((plan, index) => {
        doc.text(`${index + 1}. ${plan}`, 25, y);
        y += 6;
    });

    let ySum = 115;
    doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text(isEn ? "Financial Summary:" : "Resumen Financiero:", 120, ySum);
    ySum += 8;
    doc.setDrawColor(200); doc.setLineWidth(0.3); doc.line(120, ySum, 190, ySum); ySum += 8;

    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(`${isEn ? "Total Billed (DEBIT)" : "Total Facturado (DEBE)"}:`, 120, ySum);
    doc.text(`$${profile.cuotaMensual.toFixed(2)}`, 190, ySum, { align: "right" });
    ySum += 6;
    doc.setFontSize(8); doc.setFont("helvetica", "italic"); doc.setTextColor(100, 100, 100);
    doc.text(`(${window.NumeroALetras(profile.cuotaMensual, false)})`, 190, ySum, { align: "right" });
    doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(50, 50, 50);
    
    ySum += 8;
    doc.text(`${isEn ? "Total Paid (CREDIT)" : "Total Pagado (HABER)"}:`, 120, ySum);
    doc.setTextColor(40, 167, 69); 
    doc.text(`$${profile.montoPagado.toFixed(2)}`, 190, ySum, { align: "right" });
    ySum += 6;
    doc.setFontSize(8); doc.setFont("helvetica", "italic"); doc.setTextColor(100, 100, 100);
    doc.text(`(${window.NumeroALetras(profile.montoPagado, false)})`, 190, ySum, { align: "right" });
    doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(50, 50, 50);

    let pendienteCalc = profile.saldoPendiente;
    let favorCalc = 0;
    if (pendienteCalc < 0) { favorCalc = Math.abs(pendienteCalc); pendienteCalc = 0; }

    ySum += 8;
    doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(220, 53, 69); 
    doc.text(`${isEn ? "PENDING BALANCE" : "SALDO PENDIENTE"}:`, 120, ySum);
    doc.text(`$${pendienteCalc.toFixed(2)}`, 190, ySum, { align: "right" });
    ySum += 6;
    doc.setFontSize(8); doc.setFont("helvetica", "italic"); doc.setTextColor(100, 100, 100);
    doc.text(`(${window.NumeroALetras(pendienteCalc, false)})`, 190, ySum, { align: "right" });
    doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(50, 50, 50);

    if (favorCalc > 0) {
        ySum += 8;
        doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(40, 167, 69); 
        doc.text(`${isEn ? "CREDIT BALANCE" : "SALDO A FAVOR"}:`, 120, ySum);
        doc.text(`$${favorCalc.toFixed(2)}`, 190, ySum, { align: "right" });
        ySum += 6;
        doc.setFontSize(8); doc.setFont("helvetica", "italic"); doc.setTextColor(100, 100, 100);
        doc.text(`(${window.NumeroALetras(favorCalc, false)})`, 190, ySum, { align: "right" });
    }

    doc.setFont("helvetica", "normal"); doc.setTextColor(120, 120, 120); doc.setFontSize(8);
    const pieLegalES = "Este documento constituye un estado de cuenta informativo de las obligaciones contraídas por concepto de prestación de servicios profesionales independientes. No representa una factura fiscal.";
    const pieLegalEN = "This document constitutes an informative statement of account for obligations incurred through the provision of independent professional services. It does not represent a tax invoice.";
    const splitPie = doc.splitTextToSize(isEn ? pieLegalEN : pieLegalES, 170);
    doc.text(splitPie, 105, 275, { align: "center" });

    doc.save(`Estado_Cuenta_${profile.empresa}.pdf`);
};

window.descargarReciboPDF = function(pago, overrideProfile = null) {
    const profile = overrideProfile || window.userProfileData;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF(); 
    const isEn = window.currentLang === 'en';

    try { const logo = document.querySelector('.logo-img'); if(logo) { doc.addImage(logo, 'PNG', 20, 15, 35, 12); } } catch(e) {}

    doc.setTextColor(50, 50, 50); doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text("Anyelina V. Tiapa B.", 190, 18, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    doc.text("RIF: V324874344", 190, 23, { align: "right" }); 
    doc.text("Calle 175, Edif Parque Residencial Guaparo Norte", 190, 27, { align: "right" });
    doc.text("Torre 3, Piso 12, APT 3124, Sector La Granja", 190, 31, { align: "right" });
    doc.text("Naguanagua, Edo. Carabobo", 190, 35, { align: "right" });

    doc.setTextColor(209, 77, 156); doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text(isEn ? "PAYMENT RECEIPT" : "RECIBO DE PAGO", 20, 45);
    
    doc.setDrawColor(209, 77, 156); doc.setLineWidth(0.5); doc.line(20, 48, 190, 48);

    doc.setTextColor(50, 50, 50); doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text(isEn ? "Client Details:" : "Datos del Cliente:", 20, 58);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.text(`${isEn ? "Company" : "Empresa"}: ${profile.empresa}`, 20, 65);
    doc.text(`${isEn ? "Name" : "Nombre"}: ${profile.nombre}`, 20, 71);
    doc.text(`Cédula / RIF: ${profile.cedula || 'N/D'}`, 20, 77);
    doc.text(`${isEn ? "Phone" : "Teléfono"}: ${profile.telefono || 'N/D'}`, 20, 83);
    doc.text(`${isEn ? "Address" : "Dirección"}: ${profile.direccion || 'N/D'}`, 20, 89);

    doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text(isEn ? "Receipt Details:" : "Datos del Recibo:", 120, 58);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    const controlNum = pago.id ? pago.id.substring(0,8).toUpperCase() : Date.now().toString().slice(-8);
    doc.text(`Control N°: REC-AD.VE-${controlNum}`, 120, 65);
    doc.text(`${isEn ? "Issue Date" : "Fecha de Emisión"}: ${new Date().toLocaleDateString('es-VE')}`, 120, 71);
    doc.text(`${isEn ? "Status" : "Estatus"}: ${pago.estatus}`, 120, 77);

    doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text(isEn ? "Transaction Details:" : "Detalles de la Transacción:", 20, 105);
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    
    let y = 113;
    doc.text(`${isEn ? "Concept: Payment for digital marketing and design services." : "Concepto: Pago por servicios de marketing digital y diseño."}`, 20, y); y+=7;
    doc.text(`${isEn ? "Payment Date" : "Fecha del Pago"}: ${window.formatDateToLocal(pago.fecha)}`, 20, y); y+=7;
    doc.text(`${isEn ? "Method" : "Método"}: ${pago.metodo}`, 20, y); y+=7;
    doc.text(`${isEn ? "Reference N°" : "Referencia N°"}: ${pago.referencia}`, 20, y); y+=7;

    if(pago.bancoOrigen) { doc.text(`${isEn ? "Origin Bank" : "Banco Origen"}: ${pago.bancoOrigen}`, 20, y); y+=7; }
    if(pago.cuentaOrigen) { doc.text(`${isEn ? "Account/User" : "Cuenta/Usuario"}: ${pago.cuentaOrigen}`, 20, y); y+=7; }
    if(pago.cedulaOrigen) { doc.text(`Cédula/RIF Origen: ${pago.cedulaOrigen}`, 20, y); y+=7; }
    
    let yRight = 105;
    doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text(isEn ? "Amount:" : "Importe:", 120, yRight);
    yRight += 8;

    let isEuroMethod = (pago.metodo === 'Transferencia Bancaria' || pago.metodo === 'Pago Movil');
    let symbol = isEuroMethod ? '€' : '$';

    if(pago.montoBs && pago.montoBs > 0) {
        doc.setFont("helvetica", "normal"); doc.setFontSize(10);
        doc.text(`${isEn ? "Amount in Bolívares" : "Monto en Bolívares"}: Bs ${pago.montoBs.toFixed(2)}`, 120, yRight); yRight+=6; 
        doc.setFont("helvetica", "italic"); doc.setFontSize(8); doc.setTextColor(100, 100, 100);
        const coletillaES = `* Los cuales representan ${pago.monto.toFixed(2)} Euros a tasa BCV del día (${pago.tasaCambio}).`;
        const coletillaEN = `* Which represent ${pago.monto.toFixed(2)} Euros at the BCV rate of the day (${pago.tasaCambio}).`;
        const splitColetilla = doc.splitTextToSize(isEn ? coletillaEN : coletillaES, 70);
        doc.text(splitColetilla, 120, yRight); 
        yRight += (splitColetilla.length * 4) + 2; 
    }

    doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(40, 167, 69); 
    doc.text(`${isEn ? "Total Paid" : "Total Abonado"}: ${symbol}${pago.monto.toFixed(2)}`, 190, yRight, { align: "right" });
    
    yRight += 6;
    doc.setFontSize(9); doc.setFont("helvetica", "italic"); doc.setTextColor(100, 100, 100);
    doc.text(`Son: ${window.NumeroALetras(pago.monto, isEuroMethod)}`, 190, yRight, { align: "right" });

    doc.setDrawColor(0); doc.setLineWidth(0.3); doc.line(30, 230, 90, 230); doc.line(120, 230, 180, 230); 
    doc.setTextColor(50, 50, 50); doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text(isEn ? "Client Signature" : "Firma del Cliente", 60, 235, { align: "center" });
    doc.text(isEn ? "Authorized Signature (Anyelina V. Tiapa B.)" : "Firma Autorizada (Anyelina V. Tiapa B.)", 150, 235, { align: "center" });

    doc.setFont("helvetica", "normal"); doc.setTextColor(120, 120, 120); doc.setFontSize(8);
    const providenciaES = "El presente documento hace constar la recepción del pago detallado, con carácter de anticipo o cancelación de obligaciones por concepto de prestación de servicios profesionales independientes. Este recibo no es, ni sustituye, la emisión de una factura fiscal.";
    const providenciaEN = "This document confirms the receipt of the detailed payment, as an advance or cancellation of obligations for the provision of independent professional services. This receipt is not, nor does it substitute, the issuance of a tax invoice.";
    const splitProvidencia = doc.splitTextToSize(isEn ? providenciaEN : providenciaES, 170);
    doc.text(splitProvidencia, 105, 275, { align: "center" });

    doc.save(`Recibo_Pago_${pago.referencia}.pdf`);
    return false; 
};

// ==================== LÓGICA PAGINACIÓN Y ACCIÓN CLIENTE ====================
window.limitePagosCliente = 5;
window.cambiarLimitePagos = function() {
    const val = document.getElementById('pag-limit').value;
    window.limitePagosCliente = val === 'all' ? 'all' : parseInt(val);
    window.renderTablaPagos();
};

window.calcAddServices = function() {
    let total = 0;
    document.querySelectorAll('.add-service-cb').forEach(cb => {
        if(cb.checked) total += parseFloat(cb.getAttribute('data-price'));
    });
    document.getElementById('add-services-total').innerText = total.toFixed(2);
};

window.generarOrdenCompraPDF = function() {
    let seleccionados = [];
    let total = 0;
    document.querySelectorAll('.add-service-cb').forEach(cb => {
        if(cb.checked) {
            seleccionados.push({ name: cb.value, price: parseFloat(cb.getAttribute('data-price')) });
            total += parseFloat(cb.getAttribute('data-price'));
        }
    });

    if(seleccionados.length === 0) {
        alert(window.currentLang === 'es' ? "Debe seleccionar al menos un servicio adicional." : "You must select at least one additional service.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF(); 
    const isEn = window.currentLang === 'en';

    try {
        const logo = document.querySelector('.logo-img');
        if(logo) { doc.addImage(logo, 'PNG', 20, 15, 35, 12); } 
    } catch(e) {}

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Anyelina V. Tiapa B.", 190, 18, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("RIF: V324874344", 190, 23, { align: "right" }); 
    doc.text("Calle 175, Edif Parque Residencial Guaparo Norte", 190, 27, { align: "right" });
    doc.text("Torre 3, Piso 12, APT 3124, Sector La Granja", 190, 31, { align: "right" });
    doc.text("Naguanagua, Edo. Carabobo", 190, 35, { align: "right" });

    doc.setTextColor(209, 77, 156);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(isEn ? "ADDITIONAL SERVICES ORDER" : "ORDEN DE SERVICIOS ADICIONALES", 20, 45);
    
    doc.setDrawColor(209, 77, 156);
    doc.setLineWidth(0.5);
    doc.line(20, 48, 190, 48);

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(isEn ? "Client Details:" : "Datos del Cliente:", 20, 58);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`${isEn ? "Company" : "Empresa"}: ${window.userProfileData.empresa}`, 20, 65);
    doc.text(`${isEn ? "Name" : "Nombre"}: ${window.userProfileData.nombre}`, 20, 71);
    doc.text(`Cédula / RIF: ${window.userProfileData.cedula || 'N/D'}`, 20, 77);
    doc.text(`${isEn ? "Phone" : "Teléfono"}: ${window.userProfileData.telefono || 'N/D'}`, 20, 83);
    doc.text(`${isEn ? "Email" : "Correo"}: ${window.userProfileData.email || 'N/D'}`, 20, 89);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(isEn ? "Document Details:" : "Datos del Documento:", 120, 58);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const controlNum = Date.now().toString().slice(-6);
    doc.text(`Control N°: ORD-${controlNum}`, 120, 65);
    doc.text(`${isEn ? "Issue Date" : "Fecha de Emisión"}: ${new Date().toLocaleDateString('es-VE')}`, 120, 71);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(isEn ? "Requested Services:" : "Servicios Solicitados:", 20, 105);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    let y = 113;
    seleccionados.forEach((serv, i) => {
        doc.text(`${i + 1}. ${serv.name}`, 20, y);
        doc.text(`$${serv.price.toFixed(2)}`, 190, y, { align: "right" });
        y += 8;
    });

    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.line(120, y, 190, y);
    y += 8;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Total:", 120, y);
    doc.setTextColor(209, 77, 156);
    doc.text(`$${total.toFixed(2)}`, 190, y, { align: "right" });
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text(`Son: ${window.NumeroALetras(total, false)}`, 190, y, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8);
    const providenciaES = "Este documento es una orden de compra para adquirir los servicios detallados. No representa un comprobante de pago ni sustituye la emisión de una factura fiscal.";
    const providenciaEN = "This document is a purchase order to acquire the detailed services. It does not represent a payment receipt nor does it substitute the issuance of a tax invoice.";
    const splitProvidencia = doc.splitTextToSize(isEn ? providenciaEN : providenciaES, 170);
    doc.text(splitProvidencia, 105, 275, { align: "center" });

    doc.save(`Orden_Servicios_${window.userProfileData.empresa}.pdf`);
};

window.renderTablaPagos = function() {
    const tbody = document.querySelector('#payments-table tbody');
    tbody.innerHTML = '';
    
    if(window.userPaymentsData.length === 0) {
        const noDataText = translations[window.currentLang].noPayments || "No hay pagos registrados aún.";
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">${noDataText}</td></tr>`;
        return;
    }

    let limit = window.limitePagosCliente === 'all' ? window.userPaymentsData.length : window.limitePagosCliente;
    let pagosToShow = window.userPaymentsData.slice(0, limit);

    pagosToShow.forEach((pago, index) => {
        const tr = document.createElement('tr');
        const badgeClass = pago.estatus === 'Aprobado' ? 'status-aprobado' : 'status-procesando';

        let symbol = (pago.metodo === 'Transferencia Bancaria' || pago.metodo === 'Pago Movil') ? '€' : '$';

        let btnAction = '';
        if (pago.estatus === 'Procesando') {
            btnAction = `<button type="button" class="btn-main btn-sm btn-disabled" disabled title="El pago debe ser aprobado primero"><i class="fas fa-file-pdf"></i> Recibo</button>`;
        } else {
            btnAction = `<button type="button" class="btn-main btn-sm" onclick='window.descargarReciboPDF(${JSON.stringify(pago).replace(/'/g, "&apos;")}); return false;' style="background:#333;"><i class="fas fa-file-pdf"></i> Recibo</button>`;
        }

        let visualIndex = index + 1;

        tr.innerHTML = `
            <td><strong>${visualIndex}</strong></td>
            <td>${pago.fecha}</td>
            <td>${pago.metodo}</td>
            <td>${pago.referencia}</td>
            <td style="font-weight:bold;">${symbol}${pago.monto.toFixed(2)}</td>
            <td><span class="status-badge ${badgeClass}">${pago.estatus}</span></td>
            <td>${btnAction}</td>
        `;
        tbody.appendChild(tr);
    });
};

window.renderDashboard = function() {
    document.getElementById('client-setup').style.display = 'none';
    document.getElementById('client-dashboard').style.display = 'block';

    window.obtenerTasaBCV();

    document.getElementById('dash-nombre').innerText = window.userProfileData.nombre;
    document.getElementById('dash-empresa').innerText = window.userProfileData.empresa;
    document.getElementById('dash-planes-list').innerText = window.userProfileData.planes.join(", ");
    
    let pendienteCalc = window.userProfileData.saldoPendiente;
    let favorCalc = 0;
    if (pendienteCalc < 0) {
        favorCalc = Math.abs(pendienteCalc);
        pendienteCalc = 0;
    }

    document.getElementById('dash-deuda').innerText = `$${window.userProfileData.cuotaMensual.toFixed(2)}`;
    document.getElementById('dash-pagado').innerText = `$${window.userProfileData.montoPagado.toFixed(2)}`;
    
    const cardSaldo = document.getElementById('card-saldo');
    const statusBadge = document.getElementById('dash-status');
    const cardFavor = document.getElementById('card-favor');
    
    if (window.userProfileData.saldoPendiente <= 0) {
        document.getElementById('dash-saldo').innerText = `$0.00`;
        cardSaldo.className = "b-card success";
        statusBadge.innerText = translations[window.currentLang].statusOverdue === "VENCIDO" ? "AL DÍA / PAGADO" : "UP TO DATE / PAID";
        statusBadge.style.background = "#28a745";
    } else {
        document.getElementById('dash-saldo').innerText = `$${pendienteCalc.toFixed(2)}`;
        cardSaldo.className = "b-card alert";
        statusBadge.innerText = translations[window.currentLang].statusOverdue;
        statusBadge.style.background = "#dc3545";
    }

    if (favorCalc > 0) {
        cardFavor.style.display = 'block';
        document.getElementById('dash-favor').innerText = `$${favorCalc.toFixed(2)}`;
    } else {
        cardFavor.style.display = 'none';
    }

    window.renderTablaPagos();
};

window.formatDateToLocal = function(isoString) {
    if(!isoString) return new Date().toLocaleDateString('es-VE');
    const date = new Date(isoString);
    if(isNaN(date.getTime())) return isoString; 
    return date.toLocaleDateString('es-VE');
};

// ==================== LÓGICA DOS MODAIS E EVENTOS ====================
window.openModal = function(id) { document.getElementById(id).style.display = 'block'; };
window.closeModal = function(id) { document.getElementById(id).style.display = 'none'; };

(function() {
    window.msgIndex = 0;
    const msgs = document.querySelectorAll('#highlights-carousel .message');
    if(msgs.length > 0) {
        msgs[window.msgIndex].classList.add('active');
        setInterval(() => {
            msgs.forEach(m => m.classList.remove('active'));
            window.msgIndex = (window.msgIndex + 1) % msgs.length;
            msgs[window.msgIndex].classList.add('active');
        }, 4000);
    }
})();

// ==================== LÓGICA DE EDICIÓN DE TESTIMONIOS ====================
window.abrirEdicionTestimonio = function(id, nombre) {
    document.getElementById('edit-test-id').value = id;
    document.getElementById('edit-test-nombre').value = nombre;
    document.getElementById('edit-test-file').value = ""; 
    window.openModal('modal-edit-testimonio');
};

window.guardarEdicionTestimonio = async function(e) {
    e.preventDefault();
    const id = document.getElementById('edit-test-id').value;
    const novoNome = document.getElementById('edit-test-nombre').value;
    const fileInput = document.getElementById('edit-test-file');

    document.getElementById('loading').style.display = 'flex';
    const loadingText = document.querySelector('#loading h3');
    if(loadingText) loadingText.innerText = window.currentLang === 'es' ? "Actualizando testimonio..." : "Updating testimonial...";

    try {
        const testRef = doc(db, 'testimonios', id);

        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = async function() {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    const base64Img = canvas.toDataURL('image/jpeg', 0.8);

                    await updateDoc(testRef, {
                        nombre: novoNome,
                        base64Img: base64Img
                    });
                    finishTestimonioUpdate();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            await updateDoc(testRef, { nombre: novoNome });
            finishTestimonioUpdate();
        }
    } catch(err) {
        alert((window.currentLang === 'es' ? "Error al actualizar: " : "Error updating: ") + err.message);
        document.getElementById('loading').style.display = 'none';
        if(loadingText) loadingText.innerText = window.currentLang === 'es' ? "Cargando plataforma..." : "Loading platform...";
    }
    
    async function finishTestimonioUpdate() {
        window.closeModal('modal-edit-testimonio');
        if(window.loadAdminTestimonios) await window.loadAdminTestimonios();
        if(window.fetchTestimonios) window.fetchTestimonios();
        alert(window.currentLang === 'es' ? "Testimonio actualizado con éxito." : "Testimonial updated successfully.");
        document.getElementById('loading').style.display = 'none';
        if(loadingText) loadingText.innerText = window.currentLang === 'es' ? "Cargando plataforma..." : "Loading platform...";
    }
};

window.handleSubirTestimonio = async function(e) {
    e.preventDefault();
    const nombre = document.getElementById('testimonio-nombre').value;
    const fileInput = document.getElementById('testimonio-file');
    
    if (fileInput.files.length === 0) return;
    const file = fileInput.files[0];
    
    document.getElementById('loading').style.display = 'flex';
    const loadingText = document.querySelector('#loading h3');
    if(loadingText) loadingText.innerText = window.currentLang === 'es' ? "Procesando imagen..." : "Processing image...";

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = async function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const base64Img = canvas.toDataURL('image/jpeg', 0.8);

            try {
                if(loadingText) loadingText.innerText = window.currentLang === 'es' ? "Subiendo testimonio..." : "Uploading testimonial...";
                await addDoc(collection(db, 'testimonios'), {
                    nombre: nombre,
                    base64Img: base64Img,
                    timestamp: new Date().toISOString()
                });
                
                e.target.reset();
                if(window.loadAdminTestimonios) await window.loadAdminTestimonios(); 
                if(window.fetchTestimonios) window.fetchTestimonios(); 
                alert(window.currentLang === 'es' ? "Testimonio subido con éxito." : "Testimonial uploaded successfully.");
            } catch(err) {
                alert((window.currentLang === 'es' ? "Error al subir el testimonio: " : "Error uploading testimonial: ") + err.message);
            } finally {
                document.getElementById('loading').style.display = 'none';
                if(loadingText) loadingText.innerText = window.currentLang === 'es' ? "Cargando plataforma..." : "Loading platform...";
            }
        };
        img.onerror = function() {
            document.getElementById('loading').style.display = 'none';
            if(loadingText) loadingText.innerText = window.currentLang === 'es' ? "Cargando plataforma..." : "Loading platform...";
            alert(window.currentLang === 'es' ? "El archivo seleccionado no es una imagen válida." : "The selected file is not a valid image.");
        };
        img.src = event.target.result;
    };
    reader.onerror = function() {
        document.getElementById('loading').style.display = 'none';
        if(loadingText) loadingText.innerText = window.currentLang === 'es' ? "Cargando plataforma..." : "Loading platform...";
        alert(window.currentLang === 'es' ? "Error al leer el archivo." : "Error reading file.");
    };
    reader.readAsDataURL(file);
};

window.loadAdminTestimonios = async function() {
    try {
        const tbody = document.querySelector('#admin-testimonios-table tbody');
        if(!tbody) return;
        tbody.innerHTML = '';
        
        const snap = await getDocs(collection(db, 'testimonios'));
        let tests = [];
        snap.forEach(doc => { tests.push({id: doc.id, ...doc.data()}); });
        tests.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

        if(tests.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">${window.currentLang === 'es' ? 'No hay testimonios registrados.' : 'No testimonials registered.'}</td></tr>`;
            return;
        }

        tests.forEach(t => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${t.base64Img}" style="width: 50px; height: 50px; object-fit: contain; background: #fff; border-radius: 8px;"></td>
                <td><strong>${t.nombre}</strong></td>
                <td>
                    <button class="btn-main btn-sm" style="background-color: #ffc107; color: #333;" onclick="window.abrirEdicionTestimonio('${t.id}', '${t.nombre}')">
                        <i class="fas fa-pen"></i> ${window.currentLang === 'es' ? 'Editar' : 'Edit'}
                    </button>
                    <button class="btn-main btn-sm" style="background-color: #dc3545;" onclick="window.eliminarTestimonio('${t.id}')">
                        <i class="fas fa-trash-alt"></i> ${window.currentLang === 'es' ? 'Eliminar' : 'Delete'}
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch(e) {
        console.error("Erro cargando testemuños:", e);
        const tbody = document.querySelector('#admin-testimonios-table tbody');
        if(tbody) tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:red;">Erro cargando testemuños.</td></tr>';
    }
};

window.testimoniosData = [];
window.carruselIntervalTestimonios = null;
window.carruselIndexTestimonios = 0;

window.fetchTestimonios = async function() {
    try {
        const snap = await getDocs(collection(db, 'testimonios'));
        window.testimoniosData = [];
        snap.forEach(doc => {
            window.testimoniosData.push({ id: doc.id, ...doc.data() });
        });
        window.testimoniosData.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
        window.iniciarCarrusel();
    } catch(e) {
        console.error("Erro obtendo testemuños para a interface", e);
    }
};

window.iniciarCarrusel = function() {
    clearInterval(window.carruselIntervalTestimonios);
    const wrapper = document.getElementById('carousel-3d-wrapper');
    if(!wrapper) return;
    
    wrapper.innerHTML = '';
    
    if(window.testimoniosData.length === 0) {
        wrapper.innerHTML = `<div class="no-testimonios-msg">${window.currentLang === 'es' ? 'Aún no hay testimonios registrados.' : 'No testimonials registered yet.'}</div>`;
        return;
    }

    window.testimoniosData.forEach((testimonio, i) => {
        const card = document.createElement('div');
        card.className = 'testimonio-card';
        card.id = `testimonio-card-${i}`;
        card.innerHTML = `
            <img src="${testimonio.base64Img}" alt="${testimonio.nombre}">
            <div class="testimonio-label">${testimonio.nombre}</div>
        `;
        wrapper.appendChild(card);
    });

    window.carruselIndexTestimonios = 0;
    window.actualizarClasesCarrusel();

    if(window.testimoniosData.length > 1) {
        window.carruselIntervalTestimonios = setInterval(() => {
            window.carruselIndexTestimonios = (window.carruselIndexTestimonios + 1) % window.testimoniosData.length;
            window.actualizarClasesCarrusel();
        }, 4000); 
    }
};

window.actualizarClasesCarrusel = function() {
    const n = window.testimoniosData.length;
    if(n === 0) return;

    for(let i=0; i<n; i++) {
        const card = document.getElementById(`testimonio-card-${i}`);
        if(card) {
            card.className = 'testimonio-card'; 
        }
    }

    const centerIdx = window.carruselIndexTestimonios;
    const left1Idx = (centerIdx - 1 + n) % n;
    const left2Idx = (centerIdx - 2 + n) % n;
    const right1Idx = (centerIdx + 1) % n;
    const right2Idx = (centerIdx + 2) % n;

    if(document.getElementById(`testimonio-card-${centerIdx}`)) document.getElementById(`testimonio-card-${centerIdx}`).classList.add('center');
    
    if(n > 1) {
        if(document.getElementById(`testimonio-card-${left1Idx}`)) document.getElementById(`testimonio-card-${left1Idx}`).classList.add('left-1');
        if(document.getElementById(`testimonio-card-${right1Idx}`)) document.getElementById(`testimonio-card-${right1Idx}`).classList.add('right-1');
    }
    if(n >= 5) {
        if(document.getElementById(`testimonio-card-${left2Idx}`)) document.getElementById(`testimonio-card-${left2Idx}`).classList.add('left-2');
        if(document.getElementById(`testimonio-card-${right2Idx}`)) document.getElementById(`testimonio-card-${right2Idx}`).classList.add('right-2');
    }
};

window.eliminarTestimonio = async function(id) {
    if(confirm("¿Seguro que deseas eliminar este testimonio del carrusel?")) {
        document.getElementById('loading').style.display = 'flex';
        try {
            await deleteDoc(doc(db, 'testimonios', id));
            if(window.loadAdminTestimonios) await window.loadAdminTestimonios();
            window.fetchTestimonios();
        } catch(e) {
            alert("Error eliminando testimonio: " + e.message);
        }
        document.getElementById('loading').style.display = 'none';
    }
};

window.fetchTestimonios();
