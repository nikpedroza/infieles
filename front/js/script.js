// State
let peopleList = [];
let currentPage = 1;
let totalPages = 1;
const pageSize = 10;
const API_URL = 'http://127.0.0.1:5000';

// DOM Elements
const catalogGrid = document.getElementById('catalogGrid');
const mainSearch = document.getElementById('mainSearch');
const logoHome = document.getElementById('logoHome');
const btnAddPerson = document.getElementById('btnAddPerson');
const addModal = document.getElementById('addModal');
const detailsModal = document.getElementById('detailsModal');
const closeAdd = document.getElementById('closeAdd');
const closeDetails = document.getElementById('closeDetails');
const addPersonForm = document.getElementById('addPersonForm');
const modalBody = document.getElementById('modalBody');
const statusMessage = document.getElementById('statusMessage');

// Helpers
function calculateAge(birthDateString) {
    if (!birthDateString) return 'N/A';
    const today = new Date();
    const birthDate = new Date(birthDateString);
    if (isNaN(birthDate)) return 'N/A';
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function formatCommentDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return dateString;
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (e) {
        return dateString;
    }
}

function getImageUrl(photoPath) {
    if (!photoPath) return `${API_URL}/img/no_found_profile_user.jpg`;
    if (photoPath.startsWith('http') || photoPath.startsWith('data:')) return photoPath;

    // El back guarda solo el nombre del archivo, por lo tanto siempre va a estar dentro de /img/
    const cleanPath = photoPath.startsWith('/') ? photoPath.substring(1) : photoPath;
    if (cleanPath.startsWith('img/')) return `${API_URL}/${cleanPath}`;
    return `${API_URL}/img/${cleanPath}`;
}

// Rendering
function renderCatalog(filter = '') {
    catalogGrid.innerHTML = '';

    const filteredPeople = peopleList.filter(p => {
        const name = p.nombre || '';
        const surname = p.apellido || '';
        const fullName = `${name} ${surname}`.toLowerCase();
        return fullName.includes(filter.toLowerCase());
    });

    filteredPeople.forEach(person => {
        const card = document.createElement('div');
        card.className = 'person-card';
        card.innerHTML = `
            <img src="${getImageUrl(person.foto_perfil)}" alt="${person.nombre}" class="card-img" onerror="this.onerror=null; this.src='${API_URL}/img/no_found_profile_user.jpg';">
            <div class="card-content">
                <h2>${person.nombre} ${person.apellido}</h2>
                <div class="card-info">Click para ver detalles</div>
            </div>
        `;
        card.onclick = () => openDetails(person);
        catalogGrid.appendChild(card);
    });
}

function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <button class="btn-page" id="btnPrevPage" ${currentPage === 1 ? 'disabled' : ''}>Anterior</button>
        <span id="pageInfo">Página ${currentPage} de ${totalPages}</span>
        <button class="btn-page" id="btnNextPage" ${currentPage === totalPages ? 'disabled' : ''}>Siguiente</button>
    `;

    const btnPrev = document.getElementById('btnPrevPage');
    const btnNext = document.getElementById('btnNextPage');

    if (btnPrev) btnPrev.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            loadData();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    if (btnNext) btnNext.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadData();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
}

// Comment Helpers
function buildCommentTree(commentsList) {
    if (!commentsList || commentsList.length === 0) return [];

    const commentMap = {};
    commentsList.forEach(c => {
        // Usamos c.id_comments o c.id como identificador principal. Si no existe, usamos una generación local.
        const id = c.id_comments || c.id || Math.random().toString(36).substr(2, 9);
        commentMap[id] = { ...c, id_comments: id, id: id, replies: [] };
    });

    const rootComments = [];
    Object.values(commentMap).forEach(mapped => {
        if (mapped.parent_id && commentMap[mapped.parent_id]) {
            commentMap[mapped.parent_id].replies.push(mapped);
        } else {
            rootComments.push(mapped);
        }
    });

    return rootComments;
}

function renderCommentNode(comment, personId) {
    const authorName = "Anónimo";
    const authorInitials = "A";

    // El backend devuelve comentario_datetime
    const dateValue = comment.comentario_datetime || comment.comment_datetime || comment.comment_date || comment.datetime || '';
    const displayDate = formatCommentDate(dateValue);
    const dateHtml = displayDate ? `<span class="comment-date">${displayDate}</span>` : '';

    // Mapear comentarios hijos recursivamente
    const repliesHtml = comment.replies && comment.replies.length > 0
        ? `<div class="comment-replies">
               ${comment.replies.map(reply => renderCommentNode(reply, personId)).join('')}
           </div>`
        : '';

    // El mensaje viene en "mensaje"
    const messageContent = comment.mensaje || comment.message || comment.comment || '';
    const commentId = comment.id_comments || comment.id;

    return `
        <div class="comment-node" id="commentNode_${commentId}">
            <div class="comment-card">
                <div class="comment-header">
                    <div class="comment-avatar">${authorInitials}</div>
                    <div class="comment-meta">
                        <span class="comment-author">${authorName}</span>
                        ${dateHtml}
                    </div>
                </div>
                <div class="comment-body">
                    ${messageContent}
                </div>
                <div class="comment-actions">
                    <button class="btn-comment-action btn-toggle-reply" data-comment-id="${commentId}">
                        <svg viewBox="0 0 24 24" width="12" height="12" style="fill: currentColor; margin-right: 4px;">
                            <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
                        </svg>
                        Comentar
                    </button>
                </div>
                
                <!-- Reply Form (desplegable) -->
                <div class="reply-form-container" id="replyFormContainer_${commentId}">
                    <form class="reply-form" data-comment-id="${commentId}">
                        <textarea id="replyText_${commentId}" placeholder="Escribí una respuesta..." required></textarea>
                        <button type="submit" class="btn-submit-reply">Enviar</button>
                    </form>
                </div>
            </div>
            ${repliesHtml}
        </div>
    `;
}

function bindCommentsEvents(personId) {
    const modalBodyEl = document.getElementById('modalBody');
    if (!modalBodyEl) return;

    // Bind events for reply toggle buttons
    const replyToggleButtons = modalBodyEl.querySelectorAll('.btn-toggle-reply');
    replyToggleButtons.forEach(btn => {
        btn.onclick = () => {
            const commentId = btn.getAttribute('data-comment-id');
            const container = document.getElementById(`replyFormContainer_${commentId}`);
            if (container) {
                container.classList.toggle('active');
                if (container.classList.contains('active')) {
                    const replyText = document.getElementById(`replyText_${commentId}`);
                    if (replyText) replyText.focus();
                }
            }
        };
    });

    // Bind events for reply form submissions
    const replyForms = modalBodyEl.querySelectorAll('.reply-form');
    replyForms.forEach(form => {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const commentId = form.getAttribute('data-comment-id');
            const textarea = document.getElementById(`replyText_${commentId}`);
            const message = textarea.value.trim();
            if (!message) return;

            const submitBtn = form.querySelector('.btn-submit-reply');
            submitBtn.disabled = true;
            submitBtn.innerText = '...';

            await submitComment(personId, message, commentId);
        };
    });
}

function updateCommentsDOM(commentsList, personId) {
    const commentsTree = buildCommentTree(commentsList);
    const commentsHtml = commentsTree.length > 0
        ? commentsTree.map(c => renderCommentNode(c, personId)).join('')
        : '<p style="color: var(--text-secondary);" id="noCommentsText">Sin comentarios aún. ¡Sé el primero en comentar!</p>';

    const commentsTreeContainer = document.getElementById('commentsTreeContainer');
    if (commentsTreeContainer) {
        commentsTreeContainer.innerHTML = commentsHtml;

        // Re-asociar listeners a los nuevos formularios inyectados recursivamente
        bindCommentsEvents(personId);
    }
}

async function submitComment(personId, message, parentId) {
    try {
        const response = await fetch(`${API_URL}/user/${personId}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                parent_id: parentId,
                mensaje: message
            })
        });

        if (response.ok) {
            // El endpoint de creacion devuelve {msg: ...}, hacemos un fetch para actualizar comentarios
            const refreshResponse = await fetch(`${API_URL}/user/${personId}`);
            const updatedPerson = await refreshResponse.json();

            // 1. Actualizamos únicamente la sección de comentarios en el DOM sin recargas ni fetches extra
            updateCommentsDOM(updatedPerson.comentarios, personId);

            // 2. Limpiamos y replegamos los inputs correspondientes
            if (parentId) {
                const textarea = document.getElementById(`replyText_${parentId}`);
                if (textarea) textarea.value = '';
                const container = document.getElementById(`replyFormContainer_${parentId}`);
                if (container) container.classList.remove('active');
            } else {
                const textarea = document.getElementById('mainCommentText');
                if (textarea) textarea.value = '';
                const container = document.getElementById('mainCommentFormContainer');
                if (container) container.classList.remove('active');

                // Restablecer botón de enviar comentario principal
                const mainForm = document.getElementById('mainCommentForm');
                if (mainForm) {
                    const submitBtn = mainForm.querySelector('.btn-submit-comment');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerText = 'Enviar';
                    }
                }
            }

            // 3. Actualizamos la lista del catálogo principal silenciosamente en el fondo
            loadData(true);
        } else {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.detail?.msg || errorData.detail || 'Error en el servidor';
            throw new Error(errorMsg);
        }
    } catch (error) {
        console.error("Error al enviar comentario:", error);
        alert(
            `⚠️ Error al enviar el comentario.\n\n` +
            `Detalle del error: ${error.message}\n\n` +
            `Asegurate de que tu servidor esté corriendo correctamente.`
        );

        // Si hay error, restaurar botones correspondientes
        if (parentId) {
            const replyForm = document.querySelector(`.reply-form[data-comment-id="${parentId}"]`);
            if (replyForm) {
                const submitBtn = replyForm.querySelector('.btn-submit-reply');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = 'Enviar';
                }
            }
        } else {
            const mainForm = document.getElementById('mainCommentForm');
            if (mainForm) {
                const submitBtn = mainForm.querySelector('.btn-submit-comment');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = 'Enviar';
                }
            }
        }
    }
}

async function openDetails(personSummary) {
    const targetHash = `#user_${personSummary.id}`;
    if (window.location.hash !== targetHash) {
        window.location.hash = `user_${personSummary.id}`;
    }

    // Mostramos el modal en estado de carga
    modalBody.innerHTML = '<p style="text-align:center; padding: 2rem;">Cargando detalles...</p>';
    detailsModal.style.display = 'flex';

    try {
        // Hacemos el fetch al endpoint individual (que vas a crear vos)
        const response = await fetch(`${API_URL}/user/${personSummary.id}`);
        if (!response.ok) throw new Error("Endpoint no listo o usuario no encontrado");
        const person = await response.json();
        person.id = personSummary.id;

        const commentsTree = buildCommentTree(person.comentarios);
        const commentsHtml = commentsTree.length > 0
            ? commentsTree.map(c => renderCommentNode(c, person.id)).join('')
            : '<p style="color: var(--text-secondary);" id="noCommentsText">Sin comentarios aún. ¡Sé el primero en comentar!</p>';

        // Renderizamos con los datos completos
        modalBody.innerHTML = `
        <div class="modal-header-info">
            <img src="${getImageUrl(person.foto_perfil)}" alt="${person.nombre}" onerror="this.onerror=null; this.src='${API_URL}/img/no_found_profile_user.jpg';">
            <div class="details-column">
                <h1 style="font-size: 2.5rem; margin-bottom: 0.5rem;">${person.nombre} ${person.apellido}</h1>
                <p style="color: var(--text-secondary); font-size: 1.1rem;">
                    <strong>Edad:</strong> ${calculateAge(person.fecha_de_nacimiento)} años <br>
                    <strong>Estado:</strong> Reportado por infidelidad
                </p>
                <div class="social-links">
                    ${person.redes_sociales ? person.redes_sociales.map(red => {
            if (red.social_media.toLowerCase() === 'instagram') {
                return `<a href="https://instagram.com/${red.handle.replace('@', '')}" target="_blank" class="social-badge instagram">Instagram</a>`;
            } else if (red.social_media.toLowerCase() === 'twitter' || red.social_media.toLowerCase() === 'x') {
                return `<a href="https://twitter.com/${red.handle.replace('@', '')}" target="_blank" class="social-badge twitter">Twitter/X</a>`;
            }
            return '';
        }).join('') : ''}
                </div>
            </div>
        </div>
        
        <div class="timeline">
            <h3 class="section-title">Actos Reportados</h3>
            ${person.infidelidades ? person.infidelidades.map(i => `
                <div class="history-item">
                    <div class="item-date">${i.fecha_creacion}</div>
                    <p>${i.historia}</p>
                    ${i.evidencias && i.evidencias.length > 0 ? `
                        <div class="evidence-gallery" style="display: flex; gap: 0.8rem; margin-top: 1rem; overflow-x: auto; padding-bottom: 0.5rem;">
                            ${i.evidencias.map(ev => `
                                <img src="${getImageUrl(ev.path)}" alt="Evidencia" onclick="openLightbox('${getImageUrl(ev.path)}')" style="cursor: pointer; height: 120px; width: 120px; border-radius: 8px; border: 1px solid var(--border-color); object-fit: cover; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onerror="this.style.display='none';">
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('') : ''}
        </div>

        <div class="comments">
            <div class="comments-section-header">
                <h3>Comentarios de la Comunidad</h3>
                <button class="btn-toggle-comment" id="btnToggleMainComment">
                    <svg viewBox="0 0 24 24" width="14" height="14" style="fill: currentColor; margin-right: 4px;">
                        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
                    </svg>
                    Comentar
                </button>
            </div>
            
            <!-- Formulario principal para comentarios de nivel superior -->
            <div class="main-comment-form-container" id="mainCommentFormContainer">
                <form class="main-comment-form" id="mainCommentForm">
                    <textarea id="mainCommentText" placeholder="Escribí un comentario público..." required></textarea>
                    <button type="submit" class="btn-submit-comment">Enviar</button>
                </form>
            </div>

            <div class="comments-tree" id="commentsTreeContainer">
                ${commentsHtml}
            </div>
        </div>
    `;

        // Bind events for main comment toggle
        const btnToggleMain = document.getElementById('btnToggleMainComment');
        const mainCommentFormContainer = document.getElementById('mainCommentFormContainer');
        if (btnToggleMain && mainCommentFormContainer) {
            btnToggleMain.onclick = () => {
                mainCommentFormContainer.classList.toggle('active');
                if (mainCommentFormContainer.classList.contains('active')) {
                    const txt = document.getElementById('mainCommentText');
                    if (txt) txt.focus();
                }
            };
        }

        // Bind events for main comment submit
        const mainForm = document.getElementById('mainCommentForm');
        if (mainForm) {
            mainForm.onsubmit = async (e) => {
                e.preventDefault();
                const textarea = document.getElementById('mainCommentText');
                const message = textarea.value.trim();
                if (!message) return;

                const submitBtn = mainForm.querySelector('.btn-submit-comment');
                submitBtn.disabled = true;
                submitBtn.innerText = 'Enviando...';

                await submitComment(person.id, message, null);
            };
        }

        // Bind events for replies and form toggles
        bindCommentsEvents(person.id);

    } catch (error) {
        modalBody.innerHTML = `
            <div style="text-align:center; padding: 2rem;">
                <h3 style="color: var(--accent);">¡Aún no está listo!</h3>
                <p style="color: var(--text-secondary); margin-top: 1rem;">
                    El frontend intentó buscar los detalles en <code>GET /user/${personSummary.id}</code> pero el endpoint devolvió error.<br>
                    ¡Avisame cuando lo tengas creado en el backend!
                </p>
            </div>
        `;
    }
}

// Lightbox
function openLightbox(imgSrc) {
    document.getElementById('lightboxImage').src = imgSrc;
    document.getElementById('lightboxModal').style.display = 'flex';
}

// Events
mainSearch.oninput = (e) => renderCatalog(e.target.value);

logoHome.onclick = () => {
    mainSearch.value = '';
    renderCatalog();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

btnAddPerson.onclick = () => addModal.style.display = 'flex';

closeAdd.onclick = () => addModal.style.display = 'none';
closeDetails.onclick = () => {
    detailsModal.style.display = 'none';
    window.location.hash = '';
};
document.getElementById('closeLightbox').onclick = () => document.getElementById('lightboxModal').style.display = 'none';

window.onclick = (event) => {
    if (event.target == addModal) addModal.style.display = 'none';
    if (event.target == detailsModal) {
        detailsModal.style.display = 'none';
        window.location.hash = '';
    }
    if (event.target == document.getElementById('lightboxModal')) document.getElementById('lightboxModal').style.display = 'none';
}

addPersonForm.onsubmit = async (e) => {
    e.preventDefault();

    const fotoInput = document.getElementById('formFotoPerfil');
    if (!fotoInput.files || fotoInput.files.length === 0) {
        alert("Por favor, seleccioná una Foto de Perfil. Es obligatoria.");
        return;
    }

    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

    if (fotoInput.files[0].size > MAX_FILE_SIZE) {
        alert("La Foto de Perfil es demasiado pesada. El límite es de 50MB.");
        return;
    }

    const evidenciasInput = document.getElementById('formFotosEvidencia');
    if (evidenciasInput.files) {
        for (let i = 0; i < evidenciasInput.files.length; i++) {
            if (evidenciasInput.files[i].size > MAX_FILE_SIZE) {
                alert(`La evidencia "${evidenciasInput.files[i].name}" supera los 50MB. Por favor, elegí fotos más livianas.`);
                return;
            }
        }
    }

    const formData = new FormData();
    formData.append("nombre", document.getElementById('formNombre').value);
    formData.append("apellido", document.getElementById('formApellido').value);
    formData.append("fecha_nacimiento", document.getElementById('formNacimiento').value);

    const dni = document.getElementById('formDNI').value;
    if (dni) formData.append("dni", dni);

    formData.append("historia_del_infiel", document.getElementById('formHistoria').value);

    if (fotoInput.files.length > 0) {
        formData.append("foto_perfil", fotoInput.files[0]);
    }

    for (let i = 0; i < evidenciasInput.files.length; i++) {
        formData.append("foto_evidencia", evidenciasInput.files[i]);
    }

    const instagram = document.getElementById('formInstagram').value;
    if (instagram) formData.append("instagram", instagram);

    const twitter = document.getElementById('formTwitter').value;
    if (twitter) formData.append("twitter", twitter);

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = 'Enviando...';
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/user/new-user`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            alert('Reporte publicado exitosamente.');
            addModal.style.display = 'none';
            addPersonForm.reset();

            // Limpiar labels custom
            document.getElementById('fileTextPerfil').innerText = 'Seleccionar Imagen';
            document.getElementById('fileTextEvidencia').innerText = 'Añadir Evidencias';

            // Recargar datos desde el servidor al principio
            currentPage = 1;
            loadData();
        } else if (response.status === 409) {
            alert('Error: Ya existe un reporte para este usuario con esos mismos datos (Nombre, Apellido, Fecha de Nacimiento o DNI).');
        } else {
            const errData = await response.json().catch(() => ({}));
            alert(`Ocurrió un error al intentar publicar: ${errData.detail || response.statusText}`);
        }
    } catch (error) {
        console.error("Error enviando formulario:", error);
        alert('Error de red. Asegurate de que el servidor esté funcionando.');
    } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
};

// Custom Confirm
function customConfirm(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const msgEl = document.getElementById('confirmMessage');
        const btnOk = document.getElementById('btnConfirmOk');
        const btnCancel = document.getElementById('btnConfirmCancel');

        msgEl.innerText = message;
        modal.style.display = 'flex';

        const cleanup = () => {
            modal.style.display = 'none';
            btnOk.onclick = null;
            btnCancel.onclick = null;
        };

        btnOk.onclick = () => {
            cleanup();
            resolve(true);
        };

        btnCancel.onclick = () => {
            cleanup();
            resolve(false);
        };
    });
}

// Validación en tiempo real de duplicados
async function checkDuplicateUser() {
    const nombre = document.getElementById('formNombre').value;
    const apellido = document.getElementById('formApellido').value;
    const fecha = document.getElementById('formNacimiento').value;

    if (nombre && apellido && fecha) {
        const fd = new FormData();
        fd.append("nombre", nombre);
        fd.append("apellido", apellido);
        fd.append("fecha_nacimiento", fecha);

        try {
            const resp = await fetch(`${API_URL}/user/check-usuario`, {
                method: 'POST',
                body: fd
            });
            if (resp.ok) {
                const data = await resp.json();
                if (data.existe) {
                    const continuar = await customConfirm("Ya existe alguien con estos datos (Nombre, Apellido y Fecha de Nacimiento). ¿Querés continuar y agregar un reporte sobre la misma persona de todos modos?");
                    if (!continuar) {
                        // Limpiar campos si el usuario se arrepiente
                        document.getElementById('formNombre').value = '';
                        document.getElementById('formApellido').value = '';
                        document.getElementById('formNacimiento').value = '';
                    }
                }
            }
        } catch (e) {
            console.error("Error verificando usuario:", e);
        }
    }
}

document.getElementById('formNombre').addEventListener('blur', checkDuplicateUser);
document.getElementById('formApellido').addEventListener('blur', checkDuplicateUser);
document.getElementById('formNacimiento').addEventListener('blur', checkDuplicateUser);

// Initial Render & API Connection
async function loadData(silent = false) {
    if (!silent) {
        statusMessage.style.display = 'none';
        catalogGrid.innerHTML = '<p style="text-align:center; width:100%; color:var(--text-secondary);">Cargando catálogo...</p>';
    }

    try {
        const response = await fetch(`${API_URL}/user/?page=${currentPage}&page_size=${pageSize}`);
        if (response.ok) {
            const dataResponse = await response.json();
            peopleList = dataResponse.data || [];
            totalPages = dataResponse.total_pages || 1;

            renderCatalog();
            renderPagination();

            // Restaurar el modal si la página se recargó y hay un hash de usuario activo
            checkHash();
        } else {
            throw new Error("Respuesta de red no exitosa");
        }
    } catch (error) {
        console.error("Error conectando con el backend:", error);
        catalogGrid.innerHTML = '';
        statusMessage.innerHTML = `
            <p><strong>Error de Conexión:</strong> No se pudo cargar el catálogo en este momento.</p>
            <button class="btn-retry" onclick="loadData()">Reintentar</button>
        `;
        statusMessage.style.display = 'flex';
    }
}

function checkHash() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#user_')) {
        const userId = hash.replace('#user_', '');
        openDetails({ id: userId });
    }
}

// Escuchar cambios de hash para navegación fluida y soporte a refresco del devserver
window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#user_')) {
        const userId = hash.replace('#user_', '');
        if (detailsModal.style.display !== 'flex') {
            openDetails({ id: userId });
        }
    } else {
        detailsModal.style.display = 'none';
    }
});

loadData();
