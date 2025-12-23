// script.js  (usar con <script type="module">)

// Importar Firebase (asegúrate de que firebase-init.js esté en la misma carpeta)
import { db } from "./firebase-init.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ================== CONFIG ==================

const PIZZAS_KEY  = "fugazza_menu_pizzas_cache";
const BEBIDAS_KEY = "fugazza_menu_bebidas_cache";
const PHONE_KEY   = "fugazza_whatsapp_phone_cache";

const DEFAULT_PHONE = "5493834284204";
const PIN_GESTION   = "4321";

let menuPizzas  = [];
let menuBebidas = [];
let telefono    = DEFAULT_PHONE;

// ================== UTILIDADES ==================

function normalizarPizzas(listaCruda) {
  return (listaCruda || []).map(p => {
    const categoria = (p.categoria || "pizza").toString().toLowerCase();
    
    // Convertir precios
    let pEntera = Number(p.precioEntera);
    let pMedia = Number(p.precioMedia);

    // Si viene del formato viejo o incompleto
    if (isNaN(pEntera)) pEntera = Number(p.precio) || 0;
    if (isNaN(pMedia)) pMedia = pEntera; // Si no tiene media, asume precio entera

    return {
      nombre: p.nombre || "",
      precioEntera: pEntera,
      precioMedia:  pMedia,
      descripcion: p.descripcion || "",
      imagen: p.imagen || "",
      categoria: (categoria === "promo" || categoria === "calzone") ? categoria : "pizza"
    };
  });
}

function imagenValida(v) {
  return v && String(v).trim().length > 0;
}

// Formato nombre para ticket
function nombreParaTicket(item) {
  // Si tiene etiqueta específica (ej: " (1/2)") ya viene en el nombre o se agrega aqui
  return item.nombre; 
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

  // Defaults mínimos si está vacío
  if (!menuPizzas.length) {
    menuPizzas = normalizarPizzas([
      { nombre: "Napolitana", precioEntera: 5000, precioMedia: 3000, descripcion: "Tomate fresco, ajo.", categoria: "pizza" },
      { nombre: "Promo 1",    precioEntera: 12000, precioMedia: 12000, descripcion: "2 Muzzarellas", categoria: "promo" }
    ]);
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
  let carrito = {};

  // -------- Cards --------

  function crearCardGenerica(p) {
    const card = document.createElement("article");
    const cat = (p.categoria || "pizza").toLowerCase();
    
    card.className = "pizza-card";
    card.dataset.nombre = p.nombre;
    card.dataset.cat = cat;
    
    // Guardamos precios en el dataset
    card.dataset.precioEntera = p.precioEntera;
    card.dataset.precioMedia  = p.precioMedia;

    const imgHTML = imagenValida(p.imagen)
      ? `<img src="${p.imagen}" alt="${p.nombre}">`
      : `<img src="https://via.placeholder.com/400x250?text=${p.nombre}" alt="${p.nombre}">`;

    let botonesHTML = "";
    
    // LÓGICA DE BOTONES SEGÚN CATEGORÍA
    if (cat === "pizza") {
        // Pizza: Botones Entera y 1/2 explícitos
        botonesHTML = `
         <div class="pizza-card__acciones">
           <button class="pizza-card__btn btn-accion" data-tipo="entera">Entera</button>
           <button class="pizza-card__btn btn-accion" data-tipo="media">1/2</button>
         </div>`;
    } else {
        // Promos, Calzones, etc: Un solo botón "Agregar"
        // La lógica de preguntar "1/2" se hará en el Click
        botonesHTML = `
         <div class="pizza-card__acciones">
           <button class="pizza-card__btn btn-accion" data-tipo="unico">Agregar</button>
         </div>`;
    }

    // Mostrar precios
    let precioHTML = "";
    if (cat === "promo") {
        precioHTML = `$ ${p.precioEntera}`;
    } else {
        // Pizza o Calzone
        precioHTML = `Entera: $ ${p.precioEntera}<br>1/2: $ ${p.precioMedia}`;
    }

    card.innerHTML = `
      <div class="pizza-card__img">${imgHTML}</div>
      <div class="pizza-card__body">
        <div class="pizza-card__nombre">${p.nombre}</div>
        <div class="pizza-card__precio">${precioHTML}</div>
        ${botonesHTML}
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
      const card = crearCardGenerica(p);

      if (cat === "promo" && cardsPromos) {
        cardsPromos.appendChild(card);
      } else if (cat === "calzone" && cardsCalzones) {
        cardsCalzones.appendChild(card);
      } else if (cardsPizzas) {
        cardsPizzas.appendChild(card);
      }
    });

    menuBebidas.forEach(b => {
      if (cardsBebidas) cardsBebidas.appendChild(crearCardBebida(b));
    });

    actualizarResumen();
  }

  // -------- Carrito --------

  function agregarAlCarrito(tipo, nombre, precio) {
    const clave = `${tipo}::${nombre}`;

    if (!carrito[clave]) {
      carrito[clave] = { tipo, nombre, precio, cantidad: 0 };
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

      tr.innerHTML = `
        <td>${item.nombre}</td>
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

    // Obtener forma de pago del HTML (asegurar que existan los inputs con estos valores)
    // Values esperados: "efectivo", "debito", "credito"
    const inputPago = document.querySelector('input[name="pago"]:checked');
    const pagoSel = inputPago ? inputPago.value : "efectivo";

    const entregaSel = document.querySelector('input[name="entrega"]:checked')?.value || "Retira en local";
    let costoEnvio = 0;
    if (entregaSel === "Delivery") {
      costoEnvio = parseFloat(inputEnvio.value) || 0;
    }

    // --- CÁLCULO DE RECARGOS ---
    let recargo = 0;
    let porcentaje = 0;

    // Base imponible: Generalmente recargo es sobre la comida + envío, o solo comida.
    // Lo aplicamos a Subtotal + Envío para simplificar el total a cobrar.
    const baseCalculo = subtotal + costoEnvio;

    if (pagoSel === "debito") {
        porcentaje = 5;
        recargo = baseCalculo * 0.05;
    } else if (pagoSel === "credito") {
        porcentaje = 10;
        recargo = baseCalculo * 0.10;
    }

    const total = baseCalculo + recargo;

    // Actualizar Texto Visual
    let texto = `Total: $ ${Math.round(total).toLocaleString('es-AR')}`;
    
    // Detalles pequeños al lado
    let detalles = [];
    if (recargo > 0) detalles.push(`Recargo ${porcentaje}%`);
    if (costoEnvio > 0) detalles.push(`Envío $${costoEnvio}`);
    
    if(detalles.length > 0) texto += ` (${detalles.join(", ")})`;

    textoTotal.textContent = texto;
    miniCarrito.textContent = cantidadItems === 1 ? "1 ítem" : `${cantidadItems} ítems`;

    return { subtotal, recargo, envio: costoEnvio, total, pagoSel, cantidadItems, tipoEntrega: entregaSel, porcentaje };
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
      if (r.value === "Delivery" && r.checked) {
        inputEnvio.disabled = false;
        if(inputEnvio.value == 0) inputEnvio.value = 1000;
      } else if (r.value === "Retira en local" && r.checked) {
        inputEnvio.disabled = true;
        inputEnvio.value = "";
      }
      calcularTotal();
    });
  });
  inputEnvio.addEventListener("input", calcularTotal);

  // -------- CLICK HANDLER UNIFICADO (PIZZAS / PROMOS / CALZONES) --------
  
  function handleCardClick(e) {
      if (!e.target.classList.contains("btn-accion")) return;
      
      const card = e.target.closest(".pizza-card");
      const nombre = card.dataset.nombre;
      const cat = card.dataset.cat;
      const precioEntera = parseFloat(card.dataset.precioEntera);
      const precioMedia  = parseFloat(card.dataset.precioMedia);
      const accion = e.target.dataset.tipo; // "entera", "media", "unico"

      // 1. ES PIZZA (tiene botones explicitos)
      if (cat === "pizza") {
          if (accion === "entera") {
              agregarAlCarrito("pizza_entera", nombre, precioEntera);
          } else {
              agregarAlCarrito("pizza_media", nombre + " (1/2)", precioMedia);
          }
          return;
      }

      // 2. ES PROMO (botón unico, se agrega entera directamenet)
      if (cat === "promo") {
          agregarAlCarrito("promo", nombre, precioEntera);
          return;
      }

      // 3. ES CALZONE u OTROS (botón unico, PREGUNTAR si es media)
      if (cat === "calzone" || accion === "unico") {
          // Preguntar al usuario
          const quiereMedia = confirm(`¿Desea cargar media porción (1/2) de ${nombre}? \n\nAceptar = MEDIA ($${precioMedia})\nCancelar = ENTERA ($${precioEntera})`);
          
          if (quiereMedia) {
              agregarAlCarrito("calzone_media", nombre + " (1/2)", precioMedia);
          } else {
              agregarAlCarrito("calzone_entera", nombre, precioEntera);
          }
      }
  }

  if (cardsPizzas) cardsPizzas.addEventListener("click", handleCardClick);
  if (cardsPromos) cardsPromos.addEventListener("click", handleCardClick);
  if (cardsCalzones) cardsCalzones.addEventListener("click", handleCardClick);

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

  // Nº de pedido
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
    const { subtotal, recargo, envio, total, pagoSel, cantidadItems, tipoEntrega, porcentaje } = calcularTotal();
    if (cantidadItems === 0) {
      alert("Carrito vacío.");
      return;
    }

    // Texto forma pago
    let txtPago = "Efec / Trans";
    if (pagoSel === "debito") txtPago = `Débito (+${porcentaje}%)`;
    if (pagoSel === "credito") txtPago = `Crédito (+${porcentaje}%)`;

    const numPedido = obtenerNumeroPedido();
    let msg = `🍕 *Pizzería Fugazza* - Pedido N° ${numPedido}\n\n`;

    const nombreCliente = document.getElementById("nombre-cliente").value.trim();
    const comentarios = document.getElementById("comentarios").value.trim();
    if (nombreCliente) msg += `👤 *Cliente:* ${nombreCliente}\n\n`;

    msg += "*Detalle:*\n";
    Object.values(carrito).forEach(i => {
       msg += `- ${i.cantidad}x ${i.nombre} ($${i.precio * i.cantidad})\n`;
    });

    msg += `\nSubtotal: $${Math.round(subtotal)}\n`;
    if (envio > 0) msg += `Envío: $${Math.round(envio)}\n`;
    if (recargo > 0) msg += `Recargo (${porcentaje}%): $${Math.round(recargo)}\n`;
    
    msg += `*TOTAL: $${Math.round(total)}*\n`;
    msg += `\n💳 Pago: ${txtPago}`;
    msg += `\n🛵 Entrega: ${tipoEntrega}`;
    
    if (comentarios) msg += `\n📝 Nota: ${comentarios}`;

    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  });

  // Imprimir ticket
  btnImprimir.addEventListener("click", () => {
    const { subtotal, recargo, envio, total, pagoSel, cantidadItems, tipoEntrega, porcentaje } = calcularTotal();
    if (cantidadItems === 0) return alert("Carrito vacío");

    // Texto pago para ticket
    let txtPago = "Efec / Trans";
    if (pagoSel === "debito") txtPago = "Débito";
    if (pagoSel === "credito") txtPago = "Crédito";

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
    lineas.push("PEDIDO:"); // Cambiado a mayúsculas para resaltar

    Object.values(carrito).forEach(i => {
       
       // LÓGICA NUEVA:
       if (i.cantidad === 1) {
           // Si es 1, solo guion y nombre
           lineas.push(`- ${i.nombre}`);
       } else {
           // Si son más de 1, guion, nombre y al final "xCantidad"
           lineas.push(`- ${i.nombre} x${i.cantidad}`);
       }
    });

    lineas.push("---------------------------");
    if(envio > 0) lineas.push(`Envío: $${Math.round(envio)}`);
    if(recargo > 0) lineas.push(`Recargo ${porcentaje}%: $${Math.round(recargo)}`);
    
    lineas.push(`TOTAL: $${Math.round(total)}`);
    lineas.push(`Pago: ${txtPago}`);
    lineas.push(`Modo: ${tipoEntrega}`);
    
    if (comentarios) {
      lineas.push("---------------------------");
      lineas.push(`Nota: ${comentarios}`);
    }
    lineas.push("---------------------------");
    lineas.push("   ¡GRACIAS POR SU COMPRA!");

    ticketDiv.innerHTML = lineas
      .map((l, i) => i === 0 ? `<div class="t-header">${l}</div>` : `<div>${l}</div>`)
      .join("");

    ticketDiv.style.display = "block";
    window.print();
    setTimeout(() => { ticketDiv.style.display = "none"; }, 500);
  });

  renderIndexMenu();
}

// ================== GESTIÓN (ADMIN) ==================
// Se mantiene igual, solo nos aseguramos que guarde bien las categorías

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
        <td>${p.categoria || "pizza"}</td>
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
    
    if (!nombre) return alert("Ingrese el nombre.");
    if (isNaN(precioEntera)) return alert("Precio entera inválido.");

    const pushPizza = async (imgBase64) => {
      menuPizzas.push({
        nombre,
        precioEntera,
        precioMedia: isNaN(precioMedia) ? precioEntera : precioMedia,
        descripcion: desc,
        imagen: imgBase64 || "",
        categoria
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
    lblImgEstado.textContent = "Imagen eliminada.";
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
    const categoria = inCatPizza ? inCatPizza.value : "pizza";

    if (!nombre) return alert("Ingrese el nombre.");

    function aplicar(imagenNueva) {
      pizza.nombre = nombre;
      pizza.precioEntera = precioEntera;
      pizza.precioMedia  = isNaN(precioMedia) ? precioEntera : precioMedia;
      pizza.descripcion  = desc;
      pizza.categoria    = categoria;

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
      if (!confirm("¿Eliminar este ítem?")) return;
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
        lblImgEstado.textContent = "Tiene imagen.";
        btnQuitarImg.style.display = "inline-block";
      } else {
        lblImgEstado.textContent = "Sin imagen.";
        btnQuitarImg.style.display = "none";
      }

      btnAgregarPizza.style.display = "none";
      btnGuardarPizza.style.display = "inline-block";
      btnCancelarPizza.style.display = "inline-block";
    }
  });

  // Bebidas Admin
  btnAgregarBebida.addEventListener("click", async () => {
    const nombre = inNomBebida.value.trim();
    const precio = parseFloat(inPreBebida.value);
    if (!nombre || isNaN(precio)) return alert("Datos inválidos.");
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

    if (e.target.classList.contains("btn-eliminar")) {
        if (!confirm("¿Eliminar bebida?")) return;
        menuBebidas.splice(index, 1);
        await guardarConfigRemota();
        renderAdmin();
    }
    if (e.target.classList.contains("btn-editar")) {
        const b = menuBebidas[index];
        const n = prompt("Nombre:", b.nombre);
        const p = prompt("Precio:", b.precio);
        if(n && p) {
            b.nombre = n;
            b.precio = parseFloat(p);
            await guardarConfigRemota();
            renderAdmin();
        }
    }
  });

  btnGuardarTel.addEventListener("click", async () => {
    telefono = inTelefono.value.trim();
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