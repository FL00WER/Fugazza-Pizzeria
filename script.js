// script.js  (usar con <script type="module">)

// Importar Firebase (desde firebase-init.js)
import { db } from "./firebase-init.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ================== CONFIG ==================

const PIZZAS_KEY  = "fugazza_menu_pizzas_cache";
const BEBIDAS_KEY = "fugazza_menu_bebidas_cache";
const PHONE_KEY   = "fugazza_whatsapp_phone_cache";

const DEFAULT_PHONE = "5493834284204";
const PIN_GESTION   = "4321";

// PROMO 2: cuántas pizzas permite elegir
const PROMO2_MAX_PIZZAS = 2;
// Nombre exacto del ítem promo en el menú
const PROMO2_NOMBRE = "PROMO 2";

let menuPizzas  = [];
let menuBebidas = [];
let telefono    = DEFAULT_PHONE;

// ================== UTILIDADES ==================

function normalizarPizzas(listaCruda) {
  return (listaCruda || []).map(p => {
    const categoria = (p.categoria || "pizza").toString().toLowerCase();

    if (p.precioEntera != null && p.precioMedia != null) {
      return {
        nombre: p.nombre || "",
        precioEntera: Number(p.precioEntera) || 0,
        precioMedia:  Number(p.precioMedia) || 0,
        descripcion: p.descripcion || "",
        imagen: p.imagen || "",
        categoria: (categoria === "promo" || categoria === "calzone") ? categoria : "pizza"
      };
    }

    const base = Number(p.precio) || 0;
    return {
      nombre: p.nombre || "",
      precioEntera: base,
      precioMedia:  base,
      descripcion: p.descripcion || "",
      imagen: p.imagen || "",
      categoria: (categoria === "promo" || categoria === "calzone") ? categoria : "pizza"
    };
  });
}

function imagenValida(v) {
  return v && String(v).trim().length > 0;
}

// Formato ticket: entera solo nombre, media nombre + " 1/2"
function nombreParaTicket(item) {
  if (item.tipo === "pizza_media") return `${item.nombre} 1/2`;
  return `${item.nombre}`;
}

// ================== FIRESTORE + CACHE ==================

async function cargarDatos() {
  try {
    const cfgRef = doc(db, "config", "fugazza");
    const snap   = await getDoc(cfgRef);

    if (snap.exists()) {
      const data = snap.data();
      menuPizzas  = normalizarPizzas(data.pizzas || []);
      menuBebidas = data.bebidas || [];
      telefono    = data.telefono || DEFAULT_PHONE;

      localStorage.setItem(PIZZAS_KEY, JSON.stringify(menuPizzas));
      localStorage.setItem(BEBIDAS_KEY, JSON.stringify(menuBebidas));
      localStorage.setItem(PHONE_KEY, telefono);
      return;
    }
  } catch (err) {
    console.error("Error leyendo Firestore:", err);
  }

  // Cache local
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

  // Defaults mínimos
  if (!menuPizzas.length) {
    menuPizzas = normalizarPizzas([
      { nombre: "Napolitana", precio: 5000, descripcion: "Tomate fresco, ajo, muzza y orégano.", imagen: "", categoria: "pizza" },
      { nombre: "Fugazza",    precio: 5200, descripcion: "Doble queso, cebolla, bien cargada.", imagen: "", categoria: "pizza" },
      { nombre: "Margarita",  precio: 15000, descripcion: "Muzza, albahaca y tomate.", imagen: "", categoria: "pizza" }
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

  try {
    localStorage.setItem(PIZZAS_KEY, JSON.stringify(menuPizzas));
    localStorage.setItem(BEBIDAS_KEY, JSON.stringify(menuBebidas));
    localStorage.setItem(PHONE_KEY, telefono);
  } catch (e) {
    console.warn("No se pudo actualizar el cache local:", e);
  }
}

// ================== INDEX (PEDIDOS) ==================

function initIndex() {
  const cardsPizzas   = document.getElementById("lista-pizzas-cards");
  const cardsPromos   = document.getElementById("lista-promos-cards");
  const cardsCalzones = document.getElementById("lista-calzones-cards");

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

  if (waFloat) waFloat.href = `https://wa.me/${telefono}`;

  // Carrito: clave -> item
  // item: { tipo, nombre, precio, etiqueta, cantidad, detalle }
  let carrito = {};

  // -------- Cards --------

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
    if (cardsPizzas) cardsPizzas.innerHTML = "";
    if (cardsPromos) cardsPromos.innerHTML = "";
    if (cardsCalzones) cardsCalzones.innerHTML = "";
    if (cardsBebidas) cardsBebidas.innerHTML = "";

    menuPizzas.forEach(p => {
      const cat = (p.categoria || "pizza").toLowerCase();
      const card = crearCardPizza(p);

      if (cat === "promo" && cardsPromos) {
        cardsPromos.appendChild(card);
        return;
      }
      if (cat === "calzone" && cardsCalzones) {
        cardsCalzones.appendChild(card);
        return;
      }
      if (cardsPizzas) cardsPizzas.appendChild(card);
    });

    menuBebidas.forEach(b => {
      if (cardsBebidas) cardsBebidas.appendChild(crearCardBebida(b));
    });

    actualizarResumen();
  }

  // -------- PROMO 2 selector (por prompt) --------

  function seleccionarPizzasParaPromo2() {
    const pizzasDisponibles = menuPizzas
      .filter(p => (p.categoria || "pizza").toLowerCase() === "pizza")
      .map(p => p.nombre);

    if (!pizzasDisponibles.length) {
      alert("No hay pizzas disponibles para elegir.");
      return null;
    }

    const listado = pizzasDisponibles.map((n, i) => `${i + 1}) ${n}`).join("\n");

    const entrada = prompt(
      `PROMO 2: Seleccione ${PROMO2_MAX_PIZZAS} pizzas (por número, separado por coma).\n\n${listado}\n\nEj: 1,3`
    );

    if (!entrada) return null;

    const indices = entrada
      .split(",")
      .map(x => parseInt(x.trim(), 10))
      .filter(n => !isNaN(n))
      .map(n => n - 1)
      .filter(i => i >= 0 && i < pizzasDisponibles.length);

    // Tomamos solo las primeras PROMO2_MAX_PIZZAS válidas
    const seleccion = [];
    for (const i of indices) {
      if (seleccion.length >= PROMO2_MAX_PIZZAS) break;
      seleccion.push(pizzasDisponibles[i]);
    }

    if (seleccion.length !== PROMO2_MAX_PIZZAS) {
      alert(`Debe elegir exactamente ${PROMO2_MAX_PIZZAS} pizzas para la PROMO 2.`);
      return null;
    }

    return seleccion; // array de nombres
  }

  // -------- Carrito --------

  function agregarAlCarrito(tipo, nombre, precio, etiqueta = "", detalle = null, claveExtra = "") {
    const clave = `${tipo}::${nombre}${claveExtra ? `::${claveExtra}` : ""}`;

    if (!carrito[clave]) {
      carrito[clave] = { tipo, nombre, precio, etiqueta, cantidad: 0, detalle: null };
    }

    if (detalle) {
      carrito[clave].detalle = detalle;
    }

    carrito[clave].cantidad++;
    actualizarResumen();
  }

  function actualizarResumen() {
    tablaPizzas.innerHTML  = "";
    tablaBebidas.innerHTML = "";

    for (const [clave, item] of Object.entries(carrito)) {
      if (item.cantidad <= 0) continue;

      const tr = document.createElement("tr");
      tr.dataset.clave = clave;

      let nombreMostrar = item.nombre;

      // Visual de resumen (puede mostrar 1/2)
      if (item.tipo === "pizza_media") nombreMostrar += " (1/2)";
      if (item.tipo === "pizza_entera" && item.nombre === PROMO2_NOMBRE && Array.isArray(item.detalle)) {
        nombreMostrar += ` [${item.detalle.join(" + ")}]`;
      }

      tr.innerHTML = `
        <td>${nombreMostrar}</td>
        <td>$ ${item.precio}</td>
        <td><input type="number" class="cantidad" min="0" step="1" value="${item.cantidad}"></td>
      `;

      if (item.tipo === "bebida") tablaBebidas.appendChild(tr);
      else tablaPizzas.appendChild(tr);
    }

    calcularTotal();
  }

  function calcularTotal() {
    let subtotal = 0;
    let cantidadItems = 0;

    Object.values(carrito).forEach(item => {
      if (item.cantidad > 0) {
        subtotal += item.precio * item.cantidad;
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
    if (recargo > 0) texto += ` | Recargo 10%: $ ${recargo.toFixed(2)}`;
    if (costoEnvio > 0) texto += ` | Envío: $ ${costoEnvio.toFixed(2)}`;

    textoTotal.textContent = texto;
    miniCarrito.textContent = cantidadItems === 1 ? "1 ítem" : `${cantidadItems} ítems`;

    return { subtotal, recargo, envio: costoEnvio, total, pagoSel, cantidadItems, tipoEntrega: entregaSel };
  }

  function actualizarCantidadDesdeTabla(e) {
    if (!e.target.classList.contains("cantidad")) return;
    const tr = e.target.closest("tr");
    if (!tr) return;

    const clave = tr.dataset.clave;
    const cant = parseInt(e.target.value) || 0;

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
        inputEnvio.value = "";
      }
      calcularTotal();
    });
  });
  inputEnvio.addEventListener("input", calcularTotal);

  // Click en cards (pizzas/promos/calzones)
  function bindClickPizzas(container) {
    if (!container) return;

    container.addEventListener("click", e => {
      const card = e.target.closest(".pizza-card");
      if (!card) return;

      const nombre = card.dataset.nombre;

      const esEntera = e.target.classList.contains("btn-card-add-pizza-entera");
      const esMedia  = e.target.classList.contains("btn-card-add-pizza-media");

      if (!esEntera && !esMedia) return;

      const tipo = esMedia ? "pizza_media" : "pizza_entera";
      const precio = esMedia
        ? parseFloat(card.dataset.precioMedia)
        : parseFloat(card.dataset.precioEntera);

      // ✅ CASO ESPECIAL: PROMO 2
      if (nombre === PROMO2_NOMBRE) {
        const seleccion = seleccionarPizzasParaPromo2();
        if (!seleccion) return; // canceló o inválido

        // claveExtra para permitir varias PROMO 2 con combinaciones distintas
        const claveExtra = seleccion.join("|");

        // etiqueta no se usa en ticket como pidió su jefe, pero la dejamos vacía
        agregarAlCarrito(tipo, nombre, precio, "", seleccion, claveExtra);
        return;
      }

      // Caso normal
      agregarAlCarrito(tipo, nombre, precio);
    });
  }

  bindClickPizzas(cardsPizzas);
  bindClickPizzas(cardsPromos);
  bindClickPizzas(cardsCalzones);

  // Bebidas
  if (cardsBebidas) {
    cardsBebidas.addEventListener("click", e => {
      if (!e.target.classList.contains("btn-card-add-bebida")) return;
      const card = e.target.closest(".bebida-card");
      const nombre = card.dataset.nombre;
      const precio = parseFloat(card.dataset.precio);
      agregarAlCarrito("bebida", nombre, precio);
    });
  }

  // Nº de pedido por día
  function obtenerNumeroPedido() {
    const hoy = new Date().toISOString().slice(0, 10);
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
    const comentarios = document.getElementById("comentarios").value.trim();
    if (nombreCliente) msg += `👤 Cliente: ${nombreCliente}\n\n`;

    msg += "Pedido:\n";
    Object.values(carrito)
      .filter(i => (i.tipo === "pizza_entera" || i.tipo === "pizza_media") && i.cantidad > 0)
      .forEach(i => {
        const nombreTicket = nombreParaTicket(i);
        msg += `- ${nombreTicket} x${i.cantidad}\n`;

        if (i.nombre === PROMO2_NOMBRE && Array.isArray(i.detalle)) {
          msg += `  Incluye: ${i.detalle.join(", ")}\n`;
        }
      });

    msg += "\nBebidas:\n";
    Object.values(carrito)
      .filter(i => i.tipo === "bebida" && i.cantidad > 0)
      .forEach(i => {
        msg += `- ${i.nombre} x${i.cantidad}\n`;
      });

    msg += `\nForma de pago: ${pagoSel}\n`;
    msg += `Tipo de entrega: ${tipoEntrega}\n`;
    msg += `Subtotal: $ ${subtotal.toFixed(2)}\n`;
    if (recargo > 0) msg += `Recargo (10%): $ ${recargo.toFixed(2)}\n`;
    if (envio > 0) msg += `Envío: $ ${envio.toFixed(2)}\n`;
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

    const numPedido = obtenerNumeroPedido();
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString();
    const hora  = ahora.toLocaleTimeString();
    const nombreCliente = document.getElementById("nombre-cliente").value.trim();
    const comentarios = document.getElementById("comentarios").value.trim();

    const lineas = [];
    lineas.push("      PIZZERÍA FUGAZZA");
    lineas.push("---------------------------");
    lineas.push(`Pedido N°: ${numPedido}`);
    lineas.push(`Fecha: ${fecha} ${hora}`);
    if (nombreCliente) lineas.push(`Cliente: ${nombreCliente}`);
    lineas.push("---------------------------");
    lineas.push("Pedido:");

    Object.values(carrito)
      .filter(i => (i.tipo === "pizza_entera" || i.tipo === "pizza_media") && i.cantidad > 0)
      .forEach(i => {
        // ✅ Regla solicitada por su jefe:
        // entera => solo nombre / media => nombre + " 1/2"
        const nombreTicket = nombreParaTicket(i);

        lineas.push(`${i.cantidad}x ${nombreTicket}`);

        // ✅ PROMO 2: imprimir pizzas seleccionadas
        if (i.nombre === PROMO2_NOMBRE && Array.isArray(i.detalle)) {
          i.detalle.forEach(pz => lineas.push(`  - ${pz}`));
        }
      });

    lineas.push("Bebidas:");
    Object.values(carrito)
      .filter(i => i.tipo === "bebida" && i.cantidad > 0)
      .forEach(i => {
        lineas.push(`${i.cantidad}x ${i.nombre}`);
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

// ================== GESTIÓN ==================

function initGestion() {
  const seccionLogin = document.getElementById("panel-admin-login");
  const seccionPanel = document.getElementById("panel-admin");
  const inputPin     = document.getElementById("pin-admin");
  const btnValidar   = document.getElementById("btn-validar-pin");

  const inNomPizza        = document.getElementById("adm-pizza-nombre");
  const inPrePizzaEntera  = document.getElementById("adm-pizza-precio-entera");
  const inPrePizzaMedia   = document.getElementById("adm-pizza-precio-media");
  const inDescPizza       = document.getElementById("adm-pizza-desc");
  const inImgPizza        = document.getElementById("adm-pizza-img");
  const inCatPizza        = document.getElementById("adm-pizza-categoria");

  const lblImgEstado      = document.getElementById("adm-img-estado");
  const btnQuitarImg      = document.getElementById("adm-btn-quitar-img");
  const btnAgregarPizza   = document.getElementById("adm-btn-agregar");
  const btnGuardarPizza   = document.getElementById("adm-btn-guardar");
  const btnCancelarPizza  = document.getElementById("adm-btn-cancelar");
  const tablaAdmPizzas    = document.getElementById("adm-tabla-pizzas");

  const inNomBebida       = document.getElementById("adm-bebida-nombre");
  const inPreBebida       = document.getElementById("adm-bebida-precio");
  const btnAgregarBebida  = document.getElementById("adm-btn-agregar-bebida");
  const tablaAdmBebidas   = document.getElementById("adm-tabla-bebidas");

  const inTelefono        = document.getElementById("conf-telefono");
  const btnGuardarTel     = document.getElementById("conf-btn-guardar");

  let indiceEditandoPizza = null;
  let eliminarImagenEnEdicion = false;

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
    if (inCatPizza) inCatPizza.value = "pizza";

    lblImgEstado.textContent = "Sin imagen cargada.";
    btnQuitarImg.style.display = "none";
    btnAgregarPizza.style.display = "inline-block";
    btnGuardarPizza.style.display = "none";
    btnCancelarPizza.style.display = "none";
    indiceEditandoPizza = null;
    eliminarImagenEnEdicion = false;
  }

  function renderAdmin() {
    tablaAdmPizzas.innerHTML = "";
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

  btnAgregarPizza.addEventListener("click", async () => {
    const nombre = inNomPizza.value.trim();
    const precioEntera = parseFloat(inPrePizzaEntera.value);
    const precioMedia  = parseFloat(inPrePizzaMedia.value);
    const desc = inDescPizza.value.trim();
    const archivo = inImgPizza.files[0];

    const categoria = inCatPizza ? (inCatPizza.value || "pizza").toLowerCase() : "pizza";
    const categoriaOk = (categoria === "promo" || categoria === "calzone") ? categoria : "pizza";

    if (!nombre) return alert("Ingrese el nombre.");
    if (isNaN(precioEntera) || precioEntera <= 0) return alert("Ingrese el precio de la pizza entera.");
    if (isNaN(precioMedia)  || precioMedia  <= 0) return alert("Ingrese el precio de la media pizza.");

    const pushPizza = async (imgBase64) => {
      menuPizzas.push({
        nombre,
        precioEntera,
        precioMedia,
        descripcion: desc,
        imagen: imgBase64 || "",
        categoria: categoriaOk
      });
      await guardarConfigRemota();
      renderAdmin();
      resetFormPizza();
    };

    if (!archivo) return await pushPizza("");

    const lector = new FileReader();
    lector.onload = async () => await pushPizza(lector.result);
    lector.readAsDataURL(archivo);
  });

  btnQuitarImg.addEventListener("click", () => {
    eliminarImagenEnEdicion = true;
    lblImgEstado.textContent = "Imagen eliminada. Si no carga otra, quedará sin foto.";
  });

  btnCancelarPizza.addEventListener("click", () => resetFormPizza());

  btnGuardarPizza.addEventListener("click", async () => {
    if (indiceEditandoPizza === null) return;

    const pizza = menuPizzas[indiceEditandoPizza];

    const nombre = inNomPizza.value.trim();
    const precioEntera = parseFloat(inPrePizzaEntera.value);
    const precioMedia  = parseFloat(inPrePizzaMedia.value);
    const desc = inDescPizza.value.trim();
    const archivo = inImgPizza.files[0];

    const categoria = inCatPizza
      ? (inCatPizza.value || "pizza").toLowerCase()
      : (pizza.categoria || "pizza");

    const categoriaOk = (categoria === "promo" || categoria === "calzone") ? categoria : "pizza";

    if (!nombre) return alert("Ingrese el nombre.");
    if (isNaN(precioEntera) || precioEntera <= 0) return alert("Ingrese el precio de la pizza entera.");
    if (isNaN(precioMedia)  || precioMedia  <= 0) return alert("Ingrese el precio de la media pizza.");

    function aplicar(imagenNueva) {
      pizza.nombre = nombre;
      pizza.precioEntera = precioEntera;
      pizza.precioMedia  = precioMedia;
      pizza.descripcion  = desc;
      pizza.categoria    = categoriaOk;

      if (eliminarImagenEnEdicion) pizza.imagen = "";
      else if (imagenNueva !== null) pizza.imagen = imagenNueva;
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

  tablaAdmPizzas.addEventListener("click", async e => {
    const tr = e.target.closest("tr");
    if (!tr) return;
    const index = parseInt(tr.dataset.index, 10);

    if (e.target.classList.contains("btn-eliminar")) {
      const pin = prompt("PIN admin para eliminar:");
      if (pin !== PIN_GESTION) return alert("PIN incorrecto.");
      if (!confirm("¿Eliminar esta pizza?")) return;

      menuPizzas.splice(index, 1);
      await guardarConfigRemota();
      renderAdmin();
    }

    if (e.target.classList.contains("btn-editar")) {
      const p = menuPizzas[index];
      indiceEditandoPizza = index;
      eliminarImagenEnEdicion = false;

      inNomPizza.value = p.nombre;
      inPrePizzaEntera.value = p.precioEntera;
      inPrePizzaMedia.value  = p.precioMedia;
      inDescPizza.value = p.descripcion || "";
      inImgPizza.value = "";
      if (inCatPizza) inCatPizza.value = (p.categoria || "pizza");

      if (imagenValida(p.imagen)) {
        lblImgEstado.textContent = "Tiene imagen cargada.";
        btnQuitarImg.style.display = "inline-block";
      } else {
        lblImgEstado.textContent = "Sin imagen cargada.";
        btnQuitarImg.style.display = "none";
      }

      btnAgregarPizza.style.display = "none";
      btnGuardarPizza.style.display = "inline-block";
      btnCancelarPizza.style.display = "inline-block";
    }
  });

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
    const index = parseInt(tr.dataset.index, 10);
    const bebida = menuBebidas[index];

    if (e.target.classList.contains("btn-eliminar")) {
      const pin = prompt("PIN admin para eliminar:");
      if (pin !== PIN_GESTION) return alert("PIN incorrecto.");
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
      if (isNaN(nuevoPrecio) || nuevoPrecio <= 0) return alert("Precio inválido.");

      bebida.nombre = nuevoNombre.trim() || bebida.nombre;
      bebida.precio = nuevoPrecio;
      await guardarConfigRemota();
      renderAdmin();
    }
  });

  btnGuardarTel.addEventListener("click", async () => {
    const val = inTelefono.value.trim();
    if (!val) return alert("Ingrese un número válido.");

    telefono = val;
    await guardarConfigRemota();
    alert("Teléfono actualizado.");
  });

  renderAdmin();
}

// ================== INICIO GENERAL ==================

document.addEventListener("DOMContentLoaded", async () => {
  const page = document.body.dataset.page || "index";
  await cargarDatos();

  if (page === "index") initIndex();
  else if (page === "gestion") initGestion();
});
