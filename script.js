// script.js  (usar con <script type="module">)

// Importar Firebase (desde firebase-init.js)
import { db } from "./firebase-init.js";
import {
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ================== ESTADO GLOBAL ==================

const PIZZAS_KEY  = "fugazza_menu_pizzas_cache";
const BEBIDAS_KEY = "fugazza_menu_bebidas_cache";
const PHONE_KEY   = "fugazza_whatsapp_phone_cache";

const DEFAULT_PHONE = "5493834284204";
const PIN_GESTION   = "4321";

let menuPizzas  = [];
let menuBebidas = [];
let telefono    = DEFAULT_PHONE;

// ================== UTILIDADES COMUNES ==================

function normalizarPizzas(listaCruda) {
    return (listaCruda || []).map(p => {
        // Si ya vienen con enteras/medias, usar como están
        if (p.precioEntera != null && p.precioMedia != null) {
            return {
                nombre: p.nombre || "",
                precioEntera: Number(p.precioEntera) || 0,
                precioMedia:  Number(p.precioMedia) || 0,
                descripcion: p.descripcion || "",
                imagen: p.imagen || ""
            };
        }

        // Si vienen con "precio" único, lo usamos para ambas
        const base = Number(p.precio) || 0;
        return {
            nombre: p.nombre || "",
            precioEntera: base,
            precioMedia:  base,
            descripcion: p.descripcion || "",
            imagen: p.imagen || ""
        };
    });
}

function imagenValida(v) {
    return v && String(v).trim().length > 0;
}

// ================== CARGA / GUARDA (FIRESTORE + CACHE) ==================

async function cargarDatos() {
    // 1) Intento leer desde Firestore
    try {
        const cfgRef = doc(db, "config", "fugazza");
        const snap   = await getDoc(cfgRef);

        if (snap.exists()) {
            const data = snap.data();
            menuPizzas  = normalizarPizzas(data.pizzas || []);
            menuBebidas = data.bebidas || [];
            telefono    = data.telefono || DEFAULT_PHONE;

            // Guardar caché local
            localStorage.setItem(PIZZAS_KEY, JSON.stringify(menuPizzas));
            localStorage.setItem(BEBIDAS_KEY, JSON.stringify(menuBebidas));
            localStorage.setItem(PHONE_KEY, telefono);
            return;
        }
    } catch (err) {
        console.error("Error leyendo Firestore:", err);
    }

    // 2) Si Firestore falla o no hay doc, uso cache localStorage
    try {
        const p = localStorage.getItem(PIZZAS_KEY);
        const b = localStorage.getItem(BEBIDAS_KEY);
        const t = localStorage.getItem(PHONE_KEY);

        if (p) menuPizzas = normalizarPizzas(JSON.parse(p));
        if (b) menuBebidas = JSON.parse(b);
        if (t) telefono = t;
    } catch (e) {
        console.warn("Error leyendo cache local:", e);
    }

    // 3) Si sigue vacío, defaults mínimos
    if (!menuPizzas.length) {
        menuPizzas = normalizarPizzas([
            { nombre: "Napolitana", precio: 5000, descripcion: "Tomate fresco, ajo, muzza y orégano.", imagen: "" },
            { nombre: "Fugazza",    precio: 5200, descripcion: "Doble queso, cebolla, bien cargada.", imagen: "" },
            { nombre: "Margarita",  precio: 15000, descripcion: "Muzza, albahaca y tomate.", imagen: "" }
        ]);
    }
    if (!menuBebidas.length) {
        menuBebidas = [
            { nombre: "Gaseosa 1.5L", precio: 2000 },
            { nombre: "Agua mineral 1.5L", precio: 1500 }
        ];
    }
    if (!telefono) telefono = DEFAULT_PHONE;
}

async function guardarConfigRemota() {
    // Guardar en Firestore
    try {
        const cfgRef = doc(db, "config", "fugazza");
        await setDoc(cfgRef, {
            pizzas:  menuPizzas,
            bebidas: menuBebidas,
            telefono
        });
    } catch (err) {
        console.error("Error guardando en Firestore:", err);
        alert("No se pudo guardar en el servidor. Revise la conexión.");
    }

    // Actualizar cache local
    try {
        localStorage.setItem(PIZZAS_KEY, JSON.stringify(menuPizzas));
        localStorage.setItem(BEBIDAS_KEY, JSON.stringify(menuBebidas));
        localStorage.setItem(PHONE_KEY, telefono);
    } catch (e) {
        console.warn("No se pudo actualizar el cache local:", e);
    }
}

// ================== PÁGINA DE PEDIDOS (INDEX) ==================

function initIndex() {
    const cardsPizzas  = document.getElementById("lista-pizzas-cards");
    const cardsBebidas = document.getElementById("lista-bebidas-cards");
    const tablaPizzas  = document.getElementById("tabla-pizzas");
    const tablaBebidas = document.getElementById("tabla-bebidas");
    const textoTotal   = document.getElementById("texto-total");
    const miniCarrito  = document.getElementById("mini-carrito");

    const btnWhatsApp  = document.getElementById("btn-whatsapp");
    const btnImprimir  = document.getElementById("btn-imprimir");
    const ticketDiv    = document.getElementById("ticket");
    const btnsPago     = document.querySelectorAll('input[name="pago"]');
    const waFloat      = document.querySelector(".whatsapp-float");
    const btnsEntrega  = document.querySelectorAll('input[name="entrega"]');
    const inputEnvio   = document.getElementById("costo-envio");

    if (waFloat) {
        waFloat.href = `https://wa.me/${telefono}`;
    }

    // Carrito:
    // tipo: "pizza_entera", "pizza_media", "bebida"
    // clave: "pizza_entera::Napolitana"
    let carrito = {};

    // --- Helpers cards ---

    function crearCardPizza(p) {
        const card = document.createElement("article");
        card.className = "pizza-card";
        card.dataset.nombre       = p.nombre;
        card.dataset.precioEntera = p.precioEntera;
        card.dataset.precioMedia  = p.precioMedia;

        const imgHTML = imagenValida(p.imagen)
            ? `<img src="${p.imagen}" alt="${p.nombre}">`
            : `<img src="https://via.placeholder.com/400x250?text=Pizza" alt="${p.nombre}">`;

        card.innerHTML = `
            <div class="pizza-card__img">${imgHTML}</div>
            <div class="pizza-card__body">
                <div class="pizza-card__nombre">${p.nombre}</div>
                <div class="pizza-card__precio">
                    Entera: $ ${p.precioEntera}<br>
                    1/2: $ ${p.precioMedia}
                </div>
                <div class="pizza-card__acciones">
                    <button class="pizza-card__btn btn-card-add-pizza-entera">Entera</button>
                    <button class="pizza-card__btn btn-card-add-pizza-media">1/2</button>
                </div>
                <div class="pizza-card__descripcion">${p.descripcion || ""}</div>
            </div>
        `;
        return card;
    }

    function crearCardBebida(b) {
        const card = document.createElement("article");
        card.className = "bebida-card";
        card.dataset.nombre = b.nombre;
        card.dataset.precio = b.precio;

        card.innerHTML = `
            <div class="bebida-card__body bebida-card__body--noimg">
                <div class="bebida-card__nombre">${b.nombre}</div>
                <div class="bebida-card__precio">$ ${b.precio}</div>
                <button class="bebida-card__btn btn-card-add-bebida">Añadir</button>
            </div>
        `;
        return card;
    }

    function renderIndexMenu() {
        cardsPizzas.innerHTML  = "";
        cardsBebidas.innerHTML = "";

        menuPizzas.forEach(p => cardsPizzas.appendChild(crearCardPizza(p)));
        menuBebidas.forEach(b => cardsBebidas.appendChild(crearCardBebida(b)));

        actualizarResumen();
    }

    // --- Carrito ---

    function agregarAlCarrito(tipo, nombre, precio, etiqueta = "") {
        const clave = `${tipo}::${nombre}`;
        if (!carrito[clave]) {
            carrito[clave] = { tipo, nombre, precio, etiqueta, cantidad: 0 };
        }
        carrito[clave].cantidad++;
        actualizarResumen();
    }

    function actualizarResumen() {
        tablaPizzas.innerHTML  = "";
        tablaBebidas.innerHTML = "";

        Object.values(carrito).forEach(item => {
            if (item.cantidad <= 0) return;

            const tr = document.createElement("tr");
            tr.dataset.tipo   = item.tipo;
            tr.dataset.nombre = item.nombre;
            tr.dataset.precio = item.precio;

            let nombreMostrar = item.nombre;
            if (item.tipo === "pizza_entera") nombreMostrar += " (entera)";
            if (item.tipo === "pizza_media")  nombreMostrar += " (1/2)";

            tr.innerHTML = `
                <td>${nombreMostrar}</td>
                <td>$ ${item.precio}</td>
                <td><input type="number" class="cantidad" min="0" step="1" value="${item.cantidad}"></td>
            `;

            if (item.tipo === "bebida") tablaBebidas.appendChild(tr);
            else                        tablaPizzas.appendChild(tr);
        });

        calcularTotal();
    }

    function calcularTotal() {
        let subtotal      = 0;
        let cantidadItems = 0;

        Object.values(carrito).forEach(item => {
            if (item.cantidad > 0) {
                subtotal      += item.precio * item.cantidad;
                cantidadItems += item.cantidad;
            }
        });

        const pagoSel = document.querySelector('input[name="pago"]:checked').value;

        const entregaSel = document.querySelector('input[name="entrega"]:checked')?.value || "Retira en local";
        let costoEnvio = 0;
        if (entregaSel === "Envío / Delivery") {
            costoEnvio = parseFloat(inputEnvio.value) || 0;
        }

        let recargo = 0;
        if (pagoSel === "Tarjeta (débito/crédito)") {
            recargo = subtotal * 0.10;
        }

        const total = subtotal + recargo + costoEnvio;

        let texto = `Total: $ ${total.toFixed(2)} — Subtotal: $ ${subtotal.toFixed(2)}`;
        if (recargo > 0)   texto += ` | Recargo 10%: $ ${recargo.toFixed(2)}`;
        if (costoEnvio > 0)texto += ` | Envío: $ ${costoEnvio.toFixed(2)}`;

        textoTotal.textContent   = texto;
        miniCarrito.textContent  = cantidadItems === 1 ? "1 ítem" : `${cantidadItems} ítems`;

        return { subtotal, recargo, envio: costoEnvio, total, pagoSel, cantidadItems, tipoEntrega: entregaSel };
    }

    function actualizarCantidadDesdeTabla(e) {
        if (!e.target.classList.contains("cantidad")) return;
        const tr    = e.target.closest("tr");
        if (!tr) return;

        const tipo   = tr.dataset.tipo;
        const nombre = tr.dataset.nombre;
        const clave  = `${tipo}::${nombre}`;
        const cant   = parseInt(e.target.value) || 0;

        if (!carrito[clave]) return;

        carrito[clave].cantidad = cant;
        if (cant <= 0) delete carrito[clave];

        actualizarResumen();
    }

    tablaPizzas.addEventListener("input", actualizarCantidadDesdeTabla);
    tablaBebidas.addEventListener("input", actualizarCantidadDesdeTabla);

    btnsPago.forEach(r => r.addEventListener("change", calcularTotal));

    btnsEntrega.forEach(r => {
        r.addEventListener("change", () => {
            if (r.value === "Envío / Delivery" && r.checked) {
                inputEnvio.disabled = false;
            } else if (r.value === "Retira en local" && r.checked) {
                inputEnvio.disabled = true;
                inputEnvio.value    = "";
            }
            calcularTotal();
        });
    });

    inputEnvio.addEventListener("input", calcularTotal);

    // Añadir desde cards
    cardsPizzas.addEventListener("click", e => {
        const card = e.target.closest(".pizza-card");
        if (!card) return;
        const nombre = card.dataset.nombre;

        if (e.target.classList.contains("btn-card-add-pizza-entera")) {
            const precio = parseFloat(card.dataset.precioEntera);
            agregarAlCarrito("pizza_entera", nombre, precio, "entera");
        }
        if (e.target.classList.contains("btn-card-add-pizza-media")) {
            const precio = parseFloat(card.dataset.precioMedia);
            agregarAlCarrito("pizza_media", nombre, precio, "1/2");
        }
    });

    cardsBebidas.addEventListener("click", e => {
        if (!e.target.classList.contains("btn-card-add-bebida")) return;
        const card   = e.target.closest(".bebida-card");
        const nombre = card.dataset.nombre;
        const precio = parseFloat(card.dataset.precio);
        agregarAlCarrito("bebida", nombre, precio);
    });

    // Nº de pedido por día
    function obtenerNumeroPedido() {
        const hoy      = new Date().toISOString().slice(0, 10);
        const guardado = JSON.parse(localStorage.getItem("pedidos_fugazza") || "null");
        let n = 1;
        if (guardado && guardado.fecha === hoy) n = guardado.numero + 1;
        localStorage.setItem("pedidos_fugazza", JSON.stringify({ fecha: hoy, numero: n }));
        return n;
    }

    // WhatsApp
    btnWhatsApp.addEventListener("click", () => {
        const { subtotal, recargo, envio, total, pagoSel, cantidadItems, tipoEntrega } = calcularTotal();
        if (cantidadItems === 0) {
            alert("Por favor, seleccione al menos un producto.");
            return;
        }

        const numPedido = obtenerNumeroPedido();
        let msg = `🍕 Pizzería Fugazza - Pedido N° ${numPedido}\n\n`;

        const nombreCliente = document.getElementById("nombre-cliente").value.trim();
        const comentarios   = document.getElementById("comentarios").value.trim();
        if (nombreCliente) msg += `👤 Cliente: ${nombreCliente}\n\n`;

        msg += "Pizzas:\n";
        Object.values(carrito)
            .filter(i => (i.tipo === "pizza_entera" || i.tipo === "pizza_media") && i.cantidad > 0)
            .forEach(i => {
                const etiqueta = i.etiqueta ? ` (${i.etiqueta})` : "";
                msg += `- ${i.nombre}${etiqueta} x${i.cantidad} = $ ${i.precio * i.cantidad}\n`;
            });

        msg += "\nBebidas:\n";
        Object.values(carrito)
            .filter(i => i.tipo === "bebida" && i.cantidad > 0)
            .forEach(i => {
                msg += `- ${i.nombre} x${i.cantidad} = $ ${i.precio * i.cantidad}\n`;
            });

        msg += `\nForma de pago: ${pagoSel}\n`;
        msg += `Tipo de entrega: ${tipoEntrega}\n`;
        msg += `Subtotal: $ ${subtotal.toFixed(2)}\n`;
        if (recargo > 0) msg += `Recargo (10%): $ ${recargo.toFixed(2)}\n`;
        if (envio > 0)    msg += `Envío: $ ${envio.toFixed(2)}\n`;
        msg += `TOTAL: $ ${total.toFixed(2)}\n`;

        if (comentarios) msg += `\nComentarios: ${comentarios}\n`;

        const url = `https://wa.me/${telefono}?text=${encodeURIComponent(msg)}`;
        window.open(url, "_blank");
    });

    // Imprimir ticket (con PIN)
    btnImprimir.addEventListener("click", () => {
        const pin = prompt("Ingrese PIN de administrador para imprimir:");
        if (pin !== PIN_GESTION) {
            alert("PIN incorrecto. No tiene permiso para imprimir el ticket.");
            return;
        }

        const { subtotal, recargo, envio, total, pagoSel, cantidadItems, tipoEntrega } = calcularTotal();
        if (cantidadItems === 0) {
            alert("Por favor, seleccione al menos un producto.");
            return;
        }

        const numPedido    = obtenerNumeroPedido();
        const ahora        = new Date();
        const fecha        = ahora.toLocaleDateString();
        const hora         = ahora.toLocaleTimeString();
        const nombreCliente= document.getElementById("nombre-cliente").value.trim();
        const comentarios  = document.getElementById("comentarios").value.trim();

        const lineas = [];
        lineas.push("      PIZZERÍA FUGAZZA");
        lineas.push("---------------------------");
        lineas.push(`Pedido N°: ${numPedido}`);
        lineas.push(`Fecha: ${fecha} ${hora}`);
        if (nombreCliente) lineas.push(`Cliente: ${nombreCliente}`);
        lineas.push("---------------------------");
        lineas.push("Pizzas:");
        Object.values(carrito)
            .filter(i => (i.tipo === "pizza_entera" || i.tipo === "pizza_media") && i.cantidad > 0)
            .forEach(i => {
                const etiqueta = i.etiqueta ? ` (${i.etiqueta})` : "";
                lineas.push(`${i.cantidad}x ${i.nombre}${etiqueta}`);
                lineas.push(`   $${i.precio} c/u -> $${i.precio * i.cantidad}`);
            });
        lineas.push("Bebidas:");
        Object.values(carrito)
            .filter(i => i.tipo === "bebida" && i.cantidad > 0)
            .forEach(i => {
                lineas.push(`${i.cantidad}x ${i.nombre}`);
                lineas.push(`   $${i.precio} c/u -> $${i.precio * i.cantidad}`);
            });
        lineas.push("---------------------------");
        lineas.push(`Pago: ${pagoSel}`);
        lineas.push(`Entrega: ${tipoEntrega}`);
        if (envio > 0) lineas.push(`Envío: $${envio.toFixed(2)}`);
        lineas.push(`TOTAL: $${total.toFixed(2)}`);
        if (comentarios) {
            lineas.push("---------------------------");
            lineas.push("Comentarios:");
            lineas.push(comentarios);
        }
        lineas.push("---------------------------");
        lineas.push("   ¡GRACIAS POR SU COMPRA!");

        ticketDiv.innerHTML = lineas
            .map((l, i) => i === 0 ? `<div class="t-header">${l}</div>` : `<div>${l}</div>`)
            .join("");

        ticketDiv.style.display = "block";
        window.print();
        setTimeout(() => { ticketDiv.style.display = "none"; }, 400);
    });

    // Inicio
    renderIndexMenu();
}

// ================== PÁGINA DE GESTIÓN ==================

function initGestion() {
    const seccionLogin = document.getElementById("panel-admin-login");
    const seccionPanel = document.getElementById("panel-admin");
    const inputPin     = document.getElementById("pin-admin");
    const btnValidar   = document.getElementById("btn-validar-pin");

    // Pizzas
    const inNomPizza        = document.getElementById("adm-pizza-nombre");
    const inPrePizzaEntera  = document.getElementById("adm-pizza-precio-entera");
    const inPrePizzaMedia   = document.getElementById("adm-pizza-precio-media");
    const inDescPizza       = document.getElementById("adm-pizza-desc");
    const inImgPizza        = document.getElementById("adm-pizza-img");
    const lblImgEstado      = document.getElementById("adm-img-estado");
    const btnQuitarImg      = document.getElementById("adm-btn-quitar-img");
    const btnAgregarPizza   = document.getElementById("adm-btn-agregar");
    const btnGuardarPizza   = document.getElementById("adm-btn-guardar");
    const btnCancelarPizza  = document.getElementById("adm-btn-cancelar");
    const tablaAdmPizzas    = document.getElementById("adm-tabla-pizzas");

    // Bebidas
    const inNomBebida       = document.getElementById("adm-bebida-nombre");
    const inPreBebida       = document.getElementById("adm-bebida-precio");
    const btnAgregarBebida  = document.getElementById("adm-btn-agregar-bebida");
    const tablaAdmBebidas   = document.getElementById("adm-tabla-bebidas");

    // Teléfono
    const inTelefono        = document.getElementById("conf-telefono");
    const btnGuardarTel     = document.getElementById("conf-btn-guardar");

    let indiceEditandoPizza     = null;
    let eliminarImagenEnEdicion = false;

    // Login por PIN
    btnValidar.addEventListener("click", () => {
        if (inputPin.value === PIN_GESTION) {
            seccionLogin.style.display = "none";
            seccionPanel.style.display = "block";
            inputPin.value = "";
        } else {
            alert("PIN incorrecto.");
        }
    });

    function resetFormPizza() {
        inNomPizza.value       = "";
        inPrePizzaEntera.value = "";
        inPrePizzaMedia.value  = "";
        inDescPizza.value      = "";
        inImgPizza.value       = "";
        lblImgEstado.textContent = "Sin imagen cargada.";
        btnQuitarImg.style.display = "none";
        btnAgregarPizza.style.display  = "inline-block";
        btnGuardarPizza.style.display  = "none";
        btnCancelarPizza.style.display = "none";
        indiceEditandoPizza     = null;
        eliminarImagenEnEdicion = false;
    }

    function renderAdmin() {
        tablaAdmPizzas.innerHTML  = "";
        tablaAdmBebidas.innerHTML = "";

        menuPizzas.forEach((p, idx) => {
            const tr = document.createElement("tr");
            tr.dataset.index = String(idx);
            tr.innerHTML = `
                <td>${p.nombre}</td>
                <td>$ ${p.precioEntera}</td>
                <td>$ ${p.precioMedia}</td>
                <td>${p.descripcion || ""}</td>
                <td>${imagenValida(p.imagen) ? "Sí" : "No"}</td>
                <td>
                    <button class="btn-editar">Editar</button>
                    <button class="btn-eliminar">Eliminar</button>
                </td>
            `;
            tablaAdmPizzas.appendChild(tr);
        });

        menuBebidas.forEach((b, idx) => {
            const tr = document.createElement("tr");
            tr.dataset.index = String(idx);
            tr.innerHTML = `
                <td>${b.nombre}</td>
                <td>$ ${b.precio}</td>
                <td>
                    <button class="btn-editar">Editar</button>
                    <button class="btn-eliminar">Eliminar</button>
                </td>
            `;
            tablaAdmBebidas.appendChild(tr);
        });

        inTelefono.value = telefono;
    }

    // Alta pizza
    btnAgregarPizza.addEventListener("click", async () => {
        const nombre       = inNomPizza.value.trim();
        const precioEntera = parseFloat(inPrePizzaEntera.value);
        const precioMedia  = parseFloat(inPrePizzaMedia.value);
        const desc         = inDescPizza.value.trim();
        const archivo      = inImgPizza.files[0];

        if (!nombre) return alert("Ingrese el nombre.");
        if (isNaN(precioEntera) || precioEntera <= 0) return alert("Ingrese el precio de la pizza entera.");
        if (isNaN(precioMedia)  || precioMedia  <= 0) return alert("Ingrese el precio de la media pizza.");

        if (!archivo) {
            menuPizzas.push({
                nombre,
                precioEntera,
                precioMedia,
                descripcion: desc,
                imagen: ""
            });
            await guardarConfigRemota();
            renderAdmin();
            resetFormPizza();
            return;
        }

        const lector = new FileReader();
        lector.onload = async () => {
            const imgBase64 = lector.result;
            menuPizzas.push({
                nombre,
                precioEntera,
                precioMedia,
                descripcion: desc,
                imagen: imgBase64
            });
            await guardarConfigRemota();
            renderAdmin();
            resetFormPizza();
        };
        lector.readAsDataURL(archivo);
    });

    btnQuitarImg.addEventListener("click", () => {
        eliminarImagenEnEdicion = true;
        lblImgEstado.textContent = "Imagen eliminada. Si no carga otra, quedará sin foto.";
    });

    btnCancelarPizza.addEventListener("click", () => {
        resetFormPizza();
    });

    // Guardar edición pizza
    btnGuardarPizza.addEventListener("click", async () => {
        if (indiceEditandoPizza === null) return;
        const pizza   = menuPizzas[indiceEditandoPizza];

        const nombre       = inNomPizza.value.trim();
        const precioEntera = parseFloat(inPrePizzaEntera.value);
        const precioMedia  = parseFloat(inPrePizzaMedia.value);
        const desc         = inDescPizza.value.trim();
        const archivo      = inImgPizza.files[0];

        if (!nombre) return alert("Ingrese el nombre.");
        if (isNaN(precioEntera) || precioEntera <= 0) return alert("Ingrese el precio de la pizza entera.");
        if (isNaN(precioMedia)  || precioMedia  <= 0) return alert("Ingrese el precio de la media pizza.");

        function aplicar(imagenNueva) {
            pizza.nombre       = nombre;
            pizza.precioEntera = precioEntera;
            pizza.precioMedia  = precioMedia;
            pizza.descripcion  = desc;
            if (eliminarImagenEnEdicion) {
                pizza.imagen = "";
            } else if (imagenNueva !== null) {
                pizza.imagen = imagenNueva;
            }
        }

        if (archivo) {
            const lector = new FileReader();
            lector.onload = async () => {
                aplicar(lector.result);
                await guardarConfigRemota();
                renderAdmin();
                resetFormPizza();
            };
            lector.readAsDataURL(archivo);
        } else {
            aplicar(null);
            await guardarConfigRemota();
            renderAdmin();
            resetFormPizza();
        }
    });

    // Tabla pizzas
    tablaAdmPizzas.addEventListener("click", async e => {
        const tr = e.target.closest("tr");
        if (!tr) return;
        const index = parseInt(tr.dataset.index, 10);

        if (e.target.classList.contains("btn-eliminar")) {
            const pin = prompt("PIN admin para eliminar:");
            if (pin !== PIN_GESTION) {
                alert("PIN incorrecto.");
                return;
            }
            if (!confirm("¿Eliminar esta pizza?")) return;
            menuPizzas.splice(index, 1);
            await guardarConfigRemota();
            renderAdmin();
        }

        if (e.target.classList.contains("btn-editar")) {
            const p = menuPizzas[index];
            indiceEditandoPizza     = index;
            eliminarImagenEnEdicion = false;

            inNomPizza.value       = p.nombre;
            inPrePizzaEntera.value = p.precioEntera;
            inPrePizzaMedia.value  = p.precioMedia;
            inDescPizza.value      = p.descripcion || "";
            inImgPizza.value       = "";

            if (imagenValida(p.imagen)) {
                lblImgEstado.textContent   = "Tiene imagen cargada.";
                btnQuitarImg.style.display = "inline-block";
            } else {
                lblImgEstado.textContent   = "Sin imagen cargada.";
                btnQuitarImg.style.display = "none";
            }

            btnAgregarPizza.style.display  = "none";
            btnGuardarPizza.style.display  = "inline-block";
            btnCancelarPizza.style.display = "inline-block";
        }
    });

    // Bebidas
    btnAgregarBebida.addEventListener("click", async () => {
        const nombre = inNomBebida.value.trim();
        const precio = parseFloat(inPreBebida.value);
        if (!nombre) return alert("Ingrese el nombre.");
        if (isNaN(precio) || precio <= 0) return alert("Ingrese un precio válido.");

        menuBebidas.push({ nombre, precio });
        await guardarConfigRemota();
        renderAdmin();
        inNomBebida.value = "";
        inPreBebida.value = "";
    });

    tablaAdmBebidas.addEventListener("click", async e => {
        const tr = e.target.closest("tr");
        if (!tr) return;
        const index  = parseInt(tr.dataset.index, 10);
        const bebida = menuBebidas[index];

        if (e.target.classList.contains("btn-eliminar")) {
            const pin = prompt("PIN admin para eliminar:");
            if (pin !== PIN_GESTION) {
                alert("PIN incorrecto.");
                return;
            }
            if (!confirm("¿Eliminar esta bebida?")) return;
            menuBebidas.splice(index, 1);
            await guardarConfigRemota();
            renderAdmin();
        }

        if (e.target.classList.contains("btn-editar")) {
            const nuevoNombre = prompt("Nombre de la bebida:", bebida.nombre);
            if (nuevoNombre === null) return;
            const nuevoPrecioStr = prompt("Precio ($):", bebida.precio);
            if (nuevoPrecioStr === null) return;
            const nuevoPrecio = parseFloat(nuevoPrecioStr);
            if (isNaN(nuevoPrecio) || nuevoPrecio <= 0) {
                alert("Precio inválido.");
                return;
            }
            bebida.nombre = nuevoNombre.trim() || bebida.nombre;
            bebida.precio = nuevoPrecio;
            await guardarConfigRemota();
            renderAdmin();
        }
    });

    // Teléfono
    btnGuardarTel.addEventListener("click", async () => {
        const val = inTelefono.value.trim();
        if (!val) {
            alert("Ingrese un número válido.");
            return;
        }
        telefono = val;
        await guardarConfigRemota();
        alert("Teléfono actualizado. Los próximos pedidos usarán este número.");
    });

    renderAdmin();
}

// ================== INICIO GENERAL ==================

document.addEventListener("DOMContentLoaded", async () => {
    const page = document.body.dataset.page || "index";

    await cargarDatos();

    if (page === "index") {
        initIndex();
    } else if (page === "gestion") {
        initGestion();
    }
});
