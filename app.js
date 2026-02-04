document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let currentUser = null;
    let currentSection = 'inicio';
    
    // Elementos del DOM
    const loginScreen = document.getElementById('login-screen');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const navMenu = document.getElementById('nav-menu');
    const currentUserDisplay = document.getElementById('current-user');
    const userRoleDisplay = document.getElementById('user-role-display');
    
    // Credenciales de prueba (solo admin y docente)
    const testUsers = {
        'admin': { password: 'admin123', type: 'admin', name: 'Administrador CBIT' },
        'docente': { password: 'docente123', type: 'docente', name: 'Prof. María González' }
    };
    
    // Menús por rol
    const menus = {
        admin: [
            { id: 'inicio', icon: 'fas fa-home', text: 'Inicio', adminOnly: false },
            { id: 'inventario', icon: 'fas fa-desktop', text: 'Inventario de Equipos', adminOnly: true },
            { id: 'mantenimiento', icon: 'fas fa-tools', text: 'Mantenimiento', adminOnly: true },
            { id: 'horarios', icon: 'fas fa-calendar-alt', text: 'Horarios Disponibles', adminOnly: false },
            { id: 'solicitudes', icon: 'fas fa-file-signature', text: 'Solicitudes de Uso', adminOnly: false },
            { id: 'actividades', icon: 'fas fa-chalkboard-teacher', text: 'Registro de Actividades', adminOnly: false },
            { id: 'usuarios', icon: 'fas fa-users-cog', text: 'Gestión de Usuarios', adminOnly: true },
            { id: 'reportes', icon: 'fas fa-chart-bar', text: 'Reportes', adminOnly: true }
        ],
        docente: [
            { id: 'inicio', icon: 'fas fa-home', text: 'Inicio', adminOnly: false },
            { id: 'solicitudes', icon: 'fas fa-file-signature', text: 'Solicitar Espacio CBIT', adminOnly: false },
            { id: 'actividades', icon: 'fas fa-chalkboard-teacher', text: 'Registrar Actividades', adminOnly: false },
            { id: 'horarios', icon: 'fas fa-calendar-alt', text: 'Horarios Disponibles', adminOnly: false }
        ]
    };
    
    // Nombres de roles
    const roleNames = {
        admin: 'Administrador',
        docente: 'Docente'
    };
    
    // Función para cargar el menú según el rol
    function loadMenu(userType) {
        navMenu.innerHTML = '';
        const menuItems = menus[userType] || menus.docente;
        
        menuItems.forEach(item => {
            const li = document.createElement('li');
            li.className = `nav-item ${item.adminOnly && userType !== 'admin' ? 'disabled' : ''}`;
            li.setAttribute('data-section', item.id);
            li.innerHTML = `<i class="${item.icon}"></i> ${item.text}`;
            
            if (!(item.adminOnly && userType !== 'admin')) {
                li.addEventListener('click', () => changeSection(item.id));
            }
            
            navMenu.appendChild(li);
        });
    }
    
    // Función para actualizar avatares en todas las secciones
    function updateAvatars() {
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=1976d2&color=fff`;
        
        // Actualizar todos los avatares
        document.querySelectorAll('[id$="-avatar"]').forEach(img => {
            img.src = avatarUrl;
        });
        
        // Actualizar avatar específico de inicio
        const inicioAvatar = document.getElementById('user-avatar');
        if (inicioAvatar) {
            inicioAvatar.src = avatarUrl;
        }
    }
    
    // Función para renderizar una sección desde template
    function renderSection(sectionId) {
        // Ocultar todas las secciones
        document.querySelectorAll('.section-content').forEach(section => {
            section.classList.remove('active');
            section.innerHTML = '';
        });
        
        // Mostrar la sección seleccionada
        const sectionContainer = document.getElementById(`section-${sectionId}`);
        sectionContainer.classList.add('active');
        
        // Renderizar según la sección
        switch(sectionId) {
            case 'inicio':
                renderInicio();
                break;
            case 'inventario':
                renderInventario();
                break;
            case 'mantenimiento':
                renderMantenimiento();
                break;
            case 'horarios':
                renderHorarios();
                break;
            case 'solicitudes':
                renderSolicitudes();
                break;
            case 'actividades':
                renderActividades();
                break;
            case 'usuarios':
                renderUsuarios();
                break;
            case 'reportes':
                renderReportes();
                break;
        }
        
        // Actualizar avatares
        updateAvatars();
    }
    
    // Funciones específicas para renderizar cada sección
    function renderInicio() {
        const template = document.getElementById('template-inicio');
        const clone = template.content.cloneNode(true);
        const sectionContainer = document.getElementById('section-inicio');
        
        // Actualizar datos dinámicos
        clone.getElementById('role-badge').textContent = roleNames[currentUser.type];
        
        // Agregar el template clonado
        sectionContainer.appendChild(clone);
        
        // Agregar el contenido específico según el tipo de usuario
        const leftColumn = document.getElementById('inicio-left-column');
        if (currentUser.type === 'admin') {
            const adminTemplate = document.getElementById('template-inicio-admin');
            const adminClone = adminTemplate.content.cloneNode(true);
            leftColumn.appendChild(adminClone);
        } else {
            const docenteTemplate = document.getElementById('template-inicio-docente');
            const docenteClone = docenteTemplate.content.cloneNode(true);
            leftColumn.appendChild(docenteClone);
        }
        
        // Actualizar avatar
        updateAvatars();
    }
    
    function renderInventario() {
        const template = document.getElementById('template-inventario');
        const clone = template.content.cloneNode(true);
        const sectionContainer = document.getElementById('section-inventario');
        
        sectionContainer.appendChild(clone);
        updateAvatars();
    }
    
    function renderMantenimiento() {
        const template = document.getElementById('template-mantenimiento');
        const clone = template.content.cloneNode(true);
        const sectionContainer = document.getElementById('section-mantenimiento');
        
        sectionContainer.appendChild(clone);
        updateAvatars();
    }
    
    function renderHorarios() {
        const template = document.getElementById('template-horarios');
        const clone = template.content.cloneNode(true);
        const sectionContainer = document.getElementById('section-horarios');
        
        sectionContainer.appendChild(clone);
        updateAvatars();
    }
    
    function renderSolicitudes() {
        const sectionContainer = document.getElementById('section-solicitudes');
        
        if (currentUser.type === 'admin') {
            const template = document.getElementById('template-solicitudes-admin');
            const clone = template.content.cloneNode(true);
            sectionContainer.appendChild(clone);
        } else {
            const template = document.getElementById('template-solicitudes-docente');
            const clone = template.content.cloneNode(true);
            sectionContainer.appendChild(clone);
        }
        
        updateAvatars();
    }
    
    function renderActividades() {
        const template = document.getElementById('template-actividades');
        const clone = template.content.cloneNode(true);
        const sectionContainer = document.getElementById('section-actividades');
        
        sectionContainer.appendChild(clone);
        updateAvatars();
    }
    
    function renderUsuarios() {
        const template = document.getElementById('template-usuarios');
        const clone = template.content.cloneNode(true);
        const sectionContainer = document.getElementById('section-usuarios');
        
        sectionContainer.appendChild(clone);
        updateAvatars();
    }
    
    function renderReportes() {
        const template = document.getElementById('template-reportes');
        const clone = template.content.cloneNode(true);
        const sectionContainer = document.getElementById('section-reportes');
        
        sectionContainer.appendChild(clone);
        updateAvatars();
    }
    
    // Función para cambiar de sección
    function changeSection(sectionId) {
        currentSection = sectionId;
        
        // Actualizar clase activa en el menú
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-section') === sectionId) {
                item.classList.add('active');
            }
        });
        
        // Renderizar la sección
        renderSection(sectionId);
    }
    
    // Función para hacer login
    function login(username, password) {
        // Verificar credenciales
        if (testUsers[username] && testUsers[username].password === password) {
            
            currentUser = {
                username: username,
                type: testUsers[username].type,
                name: testUsers[username].name
            };
            
            // Mostrar aplicación y ocultar login
            loginScreen.style.display = 'none';
            appContainer.style.display = 'flex';
            
            // Actualizar información del usuario
            currentUserDisplay.textContent = currentUser.name;
            userRoleDisplay.textContent = roleNames[currentUser.type];
            
            // Cargar menú según rol
            loadMenu(currentUser.type);
            
            // Inicializar con la sección de inicio
            changeSection('inicio');
            
            return true;
        }
        return false;
    }
    
    // Función para logout
    function logout() {
        currentUser = null;
        
        // Limpiar todas las secciones
        document.querySelectorAll('.section-content').forEach(section => {
            section.classList.remove('active');
            section.innerHTML = '';
        });
        
        // Mostrar login y ocultar app
        loginScreen.style.display = 'flex';
        appContainer.style.display = 'none';
        
        // Resetear formulario de login
        loginForm.reset();
    }
    
    // Event Listeners
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            alert('Por favor complete todos los campos');
            return;
        }
        
        if (login(username, password)) {
            alert(`¡Bienvenido ${testUsers[username].name}!`);
        } else {
            alert('Credenciales incorrectas. Use las credenciales de prueba mostradas.');
        }
    });
    
    logoutBtn.addEventListener('click', logout);
    
    // Inicializar con el formulario de login
    loginScreen.style.display = 'flex';
    appContainer.style.display = 'none';
});