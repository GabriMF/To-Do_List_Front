const API_URL = 'https://to-do-list-app-9wb1.onrender.com/task/';

let USUARIO = "";
let PASSWORD = "";

// Elementos login
const loginContainer = document.getElementById('login-container');
const loginUser = document.getElementById('loginUser');
const loginPass = document.getElementById('loginPass');
const loginButton = document.getElementById('loginButton');

const logoutButton = document.getElementById('logoutButton');
const app = document.getElementById('app');


// Elementos DOM
const loadTasksButton = document.getElementById('loadTasksButton');
const listaTareas = document.getElementById('lista-tareas');
const form = document.getElementById('form-tarea');

const inputTitulo = document.getElementById('tituloTarea');
const inputDescripcion = document.getElementById('descripcionTarea');
const inputFecha = document.getElementById('fechaLimiteTarea');
const submitButton = form.querySelector('button[type="submit"]');

const mensajeLogin = document.getElementById('mensajeLogin');
const mensajeTarea = document.getElementById('mensajeTarea');
let editingTaskId = null;

// ====================
// Lógica Login
// ====================
loginButton.addEventListener('click', async () => {

    const usuario = loginUser.value.trim();
    const password = loginPass.value.trim();

    mensajeLogin.textContent = "";

    // Validación básica
    if (!usuario || !password) {
        mensajeLogin.textContent = "Introduce usuario y contraseña";
        return;
    }

    try {
        //Validacion contra API
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + btoa(usuario + ':' + password)
            }
        });

        if (response.status === 401) {
            mensajeLogin.textContent = "Usuario o contraseña incorrectos";
            return;
        }

        if (!response.ok) {
            throw new Error("Error HTTP: " + response.status);
        }

        // Guardar usuario y contraseña en variables globales y localStorage
        USUARIO = usuario;
        PASSWORD = password;

        localStorage.setItem("usuario", USUARIO);
        localStorage.setItem("password", PASSWORD);

        iniciarApp();

    } catch (error) {
        mensajeLogin.textContent = "Error al conectar con el servidor";
        console.error(error);
    }
});


function iniciarApp() {
    loginContainer.style.display = "none";
    logoutButton.style.display = "block";
    app.style.display = "block";
    userName.style.display = "block";
    userName.textContent = "Bienvenido, " + USUARIO;
}


// ====================
// Lógica Logout
// ====================

logoutButton.addEventListener('click', () => {

    localStorage.removeItem("usuario");
    localStorage.removeItem("password");
    location.reload();
});

// ====================
// CARGAR TAREAS
// ====================

loadTasksButton.addEventListener('click', cargarTareas);

// Función para determinar el estado de la tarea
function obtenerEstadoTarea(deadline) {
    if (!deadline) {
        return 'tareaSinFecha';
    }

    const ahora = new Date();
    const deadlineDate = new Date(deadline);
    if (Number.isNaN(deadlineDate.getTime())) {
        return 'tareaNormal';
    }

    const mañana = new Date(ahora);
    mañana.setDate(mañana.getDate() + 1);


    if (deadlineDate < ahora) {
        return 'tareaVencida'; // Rojo: vencida
    } else if (deadlineDate < mañana) {
        return 'tareaProxima'; // Naranja: vence hoy
    } else{
        return 'tareaNormal'; // Verde: normal
    }
}

async function cargarTareas() {
    mensajeTarea.textContent = "";

    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + btoa(USUARIO + ':' + PASSWORD)
            }
        });

        if (!response.ok) {
            
            throw new Error("Error HTTP: " + response.status);
        }

        const data = await response.json();

        // Limpiar lista
        listaTareas.innerHTML = "";

        // Pintar tareas correctamente
        data.forEach(task => {

            const li = document.createElement('li');

            // Aplicar clase de color según estado
            li.classList.add(obtenerEstadoTarea(task.deadline));

            li.innerHTML = `
                <div class="contenidoTarea">
                    <div class="tituloTarea">${task.title}</div>
                    <div class="descripcionTarea">${task.description}</div>
                    <br/>
                    <div class="fechaLimiteTarea">${task.deadline ? new Date(task.deadline).toLocaleString() : 'Sin fecha límite'}</div>
                </div>
            `;

            // Botones eliminar/editar
            const buttonContainer = document.createElement('div');
            buttonContainer.classList.add('botonesAccion');

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('botonEliminar');
            deleteButton.textContent = "Eliminar";
            deleteButton.addEventListener('click', async () => {
                await eliminarTarea(task.id);
            });

            const editButton = document.createElement('button');
            editButton.textContent = "Editar";
            editButton.addEventListener('click', () => {
                editingTaskId = task.id;
                inputTitulo.value = task.title;
                inputDescripcion.value = task.description;
                inputFecha.value = task.deadline ? task.deadline.substring(0, 16) : "";
                submitButton.textContent = "Guardar cambios";
                mensajeTarea.textContent = "Edita los datos y pulsa Guardar cambios";
            });

            buttonContainer.appendChild(editButton);
            buttonContainer.appendChild(deleteButton);
            li.appendChild(buttonContainer);
            listaTareas.appendChild(li);
        });

    } catch (error) {
        listaTareas.innerHTML = "<p>No hay tareas</p>";
        console.error(error);
    }
}


// ====================
// CREAR TAREA
// ====================

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    mensajeTarea.textContent = "";

    // VALIDACIÓN
    if (!inputTitulo.value || !inputDescripcion.value) {
        mensajeTarea.textContent = "Título y descripción son obligatorios";
        return;
    }    

    const tareaPayload = {
        title: inputTitulo.value,
        description: inputDescripcion.value,
        deadline: inputFecha.value ? inputFecha.value + ":00" : null
    };

    try {
        const method = editingTaskId ? 'PUT' : 'POST';
        const url = editingTaskId ? API_URL + editingTaskId : API_URL;
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(USUARIO + ':' + PASSWORD)
            },
            body: JSON.stringify(tareaPayload)
        });

        if (!response.ok) {
            throw new Error("Error HTTP: " + response.status);
        }

        const data = await response.json();

        console.log(editingTaskId ? "Tarea editada:" : "Tarea creada:", data);

        // Limpiar formulario y estado de edición
        form.reset();
        editingTaskId = null;
        submitButton.textContent = "Crear tarea";
        mensajeTarea.textContent = "";

        // Recargar lista automáticamente
        cargarTareas();

    } catch (error) {
        mensajeTarea.textContent = "Error al crear tarea";
        console.error(error);
    }
});


// ====================
// ELIMINAR TAREA
// ====================

async function eliminarTarea(id) {
    try {

        const response = await fetch(API_URL + id, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Basic ' + btoa(USUARIO + ':' + PASSWORD)
            }
        });

        if (!response.ok) {
            throw new Error("Error HTTP: " + response.status);
        }

        // Recargar lista
        cargarTareas();

    } catch (error) {
        mensajeTarea.textContent = "Error al eliminar tarea";
        console.error(error);
    }
}

// ======================================
// Auto Login (Guardado en localStorage)
// ======================================
window.addEventListener('DOMContentLoaded', () => {

    const userGuardado = localStorage.getItem("usuario");
    const passGuardado = localStorage.getItem("password");

    if (userGuardado && passGuardado) {
        USUARIO = userGuardado;
        PASSWORD = passGuardado;
        iniciarApp();
    }
});

//Nombre de usuario para Header
const userName = document.getElementById("userName");