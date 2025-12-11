document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.page || "index";

    // Claves de storage
    const PIZZAS_KEY = "fugazza_menu_pizzas";
    const BEBIDAS_KEY = "fugazza_menu_bebidas";
    const PHONE_KEY  = "fugazza_whatsapp_phone";
    const DEFAULT_PHONE = "5493834284204";
    const PIN_GESTION = "4321";

    // Datos en memoria
    let menuPizzas = [];
    let menuBebidas = [];
    let telefono = DEFAULT_PHONE;

    // ----------- CARGA / GUARDADO COMÚN -----------

    function normalizarPizzas(listaCruda) {
        // Asegura que cada pizza tenga precioEntera / precioMedia
        return (listaCruda || []).map(p => {
            if (p.precioEntera != null && p.precioMedia != null) {
                return p;
            }
            const precioBase = p.precio != null ? p.precio : 0;
            return {
                nombre: p.nombre || "",
                precioEntera: precioBase,
                precioMedia: precioBase, // el admin luego ajusta el precio de la 1/2
                descripcion: p.descripcion || "",
                imagen: p.imagen || ""
            };
        });
    }

    function cargarDatos() {
        const p = localStorage.getItem(PIZZAS_KEY);
        const b = localStorage.getItem(BEBIDAS_KEY);
        const t = localStorage.getItem(PHONE_KEY);

        if (p) {
            menuPizzas = normalizarPizzas(JSON.parse(p));
        } else {
            menuPizzas = normalizarPizzas([
                {
                    "nombre": "Napolitana",
                    "precioEntera": 15500,
                    "precioMedia": 15500,
                    "descripcion": "Masa Napoletana, Salsa Pomodoro, Queso Muzzarella, Tomates frescos, Ajo, Perejil, Olio de oliva y Oregano.",
                    "imagen": ""
                },
                {
                    "nombre": "Fugazza",
                    "precioEntera": 15500,
                    "precioMedia": 15500,
                    "descripcion": "Masa napoletana, Salsa pomodoro, Queso muzzarella, Cebolla finamente cortada, Olio de Oliva y oregano.",
                    "imagen": ""
                },
                {
                    "nombre": "Margarita",
                    "precioEntera": 16000,
                    "precioMedia": 16000,
                    "descripcion": "Masa napolitana, Salsa pomodoro, Muzzarella, albahaca y aceite de oliva",
                    "imagen": ""
                },
                {
                    "nombre": "Muzzarella",
                    "precioEntera": 13500,
                    "precioMedia": 13500,
                    "descripcion": "Masa Napoletana, Salsa Pomodoro, Muzzarella fresca, Aceite de oliva y oregano.",
                    "imagen": ""
                },
                {
                    "nombre": "Especial",
                    "precioEntera": 15500,
                    "precioMedia": 15500,
                    "descripcion": "Masa napoletana, Salsa pomodoro, Queso Muzzarella, Jamón feteado, morrones naturales, aceite de oliva, oregano.",
                    "imagen": ""
                },
                {
                    "nombre": "Roquefort",
                    "precioEntera": 15500,
                    "precioMedia": 15500,
                    "descripcion": "Masa napoletana, salsa pomodoro, queso Muzzarella, queso Roquefort, aceite de oliva y oregano.",
                    "imagen": ""
                },
                {
                    "nombre": "Doble Muzza",
                    "precioEntera": 15500,
                    "precioMedia": 15500,
                    "descripcion": "Masa napoletana, salsa pomodoro, queso muzzarella, olio de oliva y oregano",
                    "imagen": ""
                },
                {
                    "nombre": "Anchoas",
                    "precioEntera": 15500,
                    "precioMedia": 15500,
                    "descripcion": "Masa napoletana, salsa pomodora, queso muzzarella, filetes de anchoas, morrores, aceite de oliva y oregano.",
                    "imagen": ""
                },
                {
                    "nombre": "Romana",
                    "precioEntera": 22000,
                    "precioMedia": 22000,
                    "descripcion": "Masa napoletana, salsa pomodoro, queso muzzarella, jamon, tomate y ajo.",
                    "imagen": ""
                },
                {
                    "nombre": "Esp. De la casa",
                    "precioEntera": 17000,
                    "precioMedia": 17000,
                    "descripcion": "Masa napoletana, salsa pomodoro, doble queso muzzarella, cebolla finamente cortada, panceta, pimienta, olio de oliva y oregano.",
                    "imagen": ""
                },
                {
                    "nombre": "Americana",
                    "precioEntera": 18000,
                    "precioMedia": 18000,
                    "descripcion": "Masa napoletana, salsa pomodoro, queso muzzarella, panceta ahumada, huevo ahumado y morrón.",
                    "imagen": ""
                },
                {
                    "nombre": "Palmitos",
                    "precioEntera": 18000,
                    "precioMedia": 18000,
                    "descripcion": "Masa napoletana, salsa, queso muzzarella, jamon, palmitos, salsa golf y olio de oliva.",
                    "imagen": ""
                },
                {
                    "nombre": "Verdeo",
                    "precioEntera": 15500,
                    "precioMedia": 15500,
                    "descripcion": "Masa napoletana, salsa pomodoro, queso muzzarella, cebolla de verdeo y aceite de oliva.",
                    "imagen": ""
                },
                {
                    "nombre": "Panceta y Verdeo",
                    "precioEntera": 17000,
                    "precioMedia": 17000,
                    "descripcion": "Masa napoletana, salsa pomodoro, queso muzzarella, panceta, cebollitas de verdeo.",
                    "imagen": ""
                },
                {
                    "nombre": "4 Quesos",
                    "precioEntera": 17000,
                    "precioMedia": 17000,
                    "descripcion": "Masa napoletana, salsa pomodoro, queso muzzarella, roquefort, parmesano, provolone, morrones, olio de oliva y oregano.",
                    "imagen": ""
                },
                {
                    "nombre": "Calabrezza",
                    "precioEntera": 15500,
                    "precioMedia": 15500,
                    "descripcion": "Masa napoletana, salswa pomodoro, queso muzzarella, longaniza tipo calabressa aceite de oliva y oregano.",
                    "imagen": ""
                },
                {
                    "nombre": "New York",
                    "precioEntera": 17000,
                    "precioMedia": 17000,
                    "descripcion": "Masa napoletana, salsa pomodoro, queso muzzarella, peperoni, aceite de oliva, oregano.",
                    "imagen": ""
                },
                {
                    "nombre": "Lomo Ahumado",
                    "precioEntera": 17000,
                    "precioMedia": 17000,
                    "descripcion": "Masa napoletana, salsa pomodoro, queso muzzarella, lomo de cerdo ahumado, morrones, aceite de oliva, oregano.",
                    "imagen": ""
                }
                ]);
        }

        if (b) {
            menuBebidas = JSON.parse(b);
        } else {
            menuBebidas = [
                { nombre: "Gaseosa 1.5L", precio: 2000 },
                { nombre: "Agua mineral 1.5L", precio: 1500 }
            ];
        }

        telefono = t || DEFAULT_PHONE;
    }

    function guardarMenus() {
        localStorage.setItem(PIZZAS_KEY, JSON.stringify(menuPizzas));
        localStorage.setItem(BEBIDAS_KEY, JSON.stringify(menuBebidas));
    }

    function guardarTelefono() {
        localStorage.setItem(PHONE_KEY, telefono);
    }

    function imagenValida(v) {
        return v && v.trim().length > 0;
    }

    // =========================================================
    // ===============   PÁGINA DE PEDIDOS   ===================
    // =========================================================
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

        // Teléfono configurado en gestión
        if (waFloat) {
            waFloat.href = `https://wa.me/${telefono}`;
        }

        // 🛒 Carrito: diferenciamos pizza entera / media / bebida
        // tipo: "pizza_entera", "pizza_media", "bebida"
        // clave = "pizza_entera::Napolitana"
        let carrito = {};

        // ---------- helpers ----------

        function crearCardPizza(p) {
            const card = document.createElement("article");
            card.className = "pizza-card";
            card.dataset.nombre = p.nombre;
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

        // Renderiza solo las cards, NUNCA el resumen
        function renderIndexMenu() {
            cardsPizzas.innerHTML = "";
            cardsBebidas.innerHTML = "";

            menuPizzas.forEach(p => {
                cardsPizzas.appendChild(crearCardPizza(p));
            });

            menuBebidas.forEach(b => {
                cardsBebidas.appendChild(crearCardBebida(b));
            });

            actualizarResumen();   // el resumen arranca vacío
        }

        // Agrega o suma un ítem al carrito
        function agregarAlCarrito(tipo, nombre, precio, etiqueta) {
            // tipo: "pizza_entera", "pizza_media", "bebida"
            const clave = `${tipo}::${nombre}`;
            if (!carrito[clave]) {
                carrito[clave] = {
                    tipo,
                    nombre,
                    precio,
                    etiqueta: etiqueta || "",
                    cantidad: 0
                };
            }
            carrito[clave].cantidad++;
            actualizarResumen();
        }

        // Construye las tablas de Pizzas y Bebidas SOLO con lo que hay en el carrito
        function actualizarResumen() {
            tablaPizzas.innerHTML = "";
            tablaBebidas.innerHTML = "";

            Object.values(carrito).forEach(item => {
                if (item.cantidad <= 0) return;

                const tr = document.createElement("tr");
                tr.dataset.tipo = item.tipo;
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

                if (item.tipo === "bebida") {
                    tablaBebidas.appendChild(tr);
                } else {
                    tablaPizzas.appendChild(tr);
                }
            });

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

            // Tipo de entrega y costo de envío
            const entregaSel = document.querySelector('input[name="entrega"]:checked')?.value || "Retira en local";
            let costoEnvio = 0;
            if (entregaSel === "Envío / Delivery") {
                costoEnvio = parseFloat(inputEnvio.value) || 0;
            }

            // Recargo solo sobre productos (no sobre envío)
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

            return {
                subtotal,
                recargo,
                envio: costoEnvio,
                total,
                pagoSel,
                cantidadItems,
                tipoEntrega: entregaSel
            };
        }

        // ---------- eventos cantidades en resumen ----------
        function actualizarCantidadDesdeTabla(e) {
            if (!e.target.classList.contains("cantidad")) return;
            const tr = e.target.closest("tr");
            if (!tr) return;

            const tipo = tr.dataset.tipo;
            const nombre = tr.dataset.nombre;
            const clave = `${tipo}::${nombre}`;
            const cant = parseInt(e.target.value) || 0;

            if (!carrito[clave]) return;

            carrito[clave].cantidad = cant;

            if (cant <= 0) {
                delete carrito[clave];
            }

            actualizarResumen();
        }

        tablaPizzas.addEventListener("input", actualizarCantidadDesdeTabla);
        tablaBebidas.addEventListener("input", actualizarCantidadDesdeTabla);

        // ---------- cambio de forma de pago ----------
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

        // ---------- Añadir desde cards ----------
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
            const card = e.target.closest(".bebida-card");
            const nombre = card.dataset.nombre;
            const precio = parseFloat(card.dataset.precio);
            agregarAlCarrito("bebida", nombre, precio, "");
        });

        // ---------- Nº de pedido por día ----------
        function obtenerNumeroPedido() {
            const hoy = new Date().toISOString().slice(0, 10);
            const guardado = JSON.parse(localStorage.getItem("pedidos_fugazza") || "null");
            let n = 1;
            if (guardado && guardado.fecha === hoy) n = guardado.numero + 1;
            localStorage.setItem("pedidos_fugazza", JSON.stringify({ fecha: hoy, numero: n }));
            return n;
        }

        // ---------- WhatsApp ----------
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

            msg += "Pizzas:\n";
            Object.values(carrito)
                .filter(i => i.tipo === "pizza_entera" || i.tipo === "pizza_media")
                .filter(i => i.cantidad > 0)
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
            if (envio > 0) msg += `Envío: $ ${envio.toFixed(2)}\n`;
            msg += `TOTAL: $ ${total.toFixed(2)}\n`;

            if (comentarios) msg += `\nComentarios: ${comentarios}\n`;

            const url = `https://wa.me/${telefono}?text=${encodeURIComponent(msg)}`;
            window.open(url, "_blank");
        });

        // ---------- Imprimir ticket ----------
        btnImprimir.addEventListener("click", () => {
            const pin = prompt("Ingrese PIN de administrador para imprimir:");

            if (pin !== "4321") {
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
            const hora = ahora.toLocaleTimeString();
            const nombreCliente = document.getElementById("nombre-cliente").value.trim();
            const comentarios = document.getElementById("comentarios").value.trim();

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
                .map((l, i) => {
                    if (i === 0) {
                        return `<div class="t-header">${l}</div>`;
                    }
                    return `<div>${l}</div>`;
                })
                .join("");

            ticketDiv.style.display = "block";
            window.print();
            setTimeout(() => { ticketDiv.style.display = "none"; }, 400);
        });

        // ---------- inicio ----------
        renderIndexMenu();
    }

    // =========================================================
    // ===============   PÁGINA DE GESTIÓN    ==================
    // =========================================================
    function initGestion() {
        const seccionLogin = document.getElementById("panel-admin-login");
        const seccionPanel = document.getElementById("panel-admin");
        const inputPin     = document.getElementById("pin-admin");
        const btnValidar   = document.getElementById("btn-validar-pin");

        // Inputs pizzas
        const inNomPizza = document.getElementById("adm-pizza-nombre");
        const inPrePizzaEntera = document.getElementById("adm-pizza-precio-entera");
        const inPrePizzaMedia  = document.getElementById("adm-pizza-precio-media");
        const inDescPizza = document.getElementById("adm-pizza-desc");
        const inImgPizza  = document.getElementById("adm-pizza-img");
        const lblImgEstado = document.getElementById("adm-img-estado");
        const btnQuitarImg = document.getElementById("adm-btn-quitar-img");
        const btnAgregarPizza = document.getElementById("adm-btn-agregar");
        const btnGuardarPizza = document.getElementById("adm-btn-guardar");
        const btnCancelarPizza = document.getElementById("adm-btn-cancelar");
        const tablaAdmPizzas = document.getElementById("adm-tabla-pizzas");

        // Inputs bebidas
        const inNomBebida = document.getElementById("adm-bebida-nombre");
        const inPreBebida = document.getElementById("adm-bebida-precio");
        const btnAgregarBebida = document.getElementById("adm-btn-agregar-bebida");
        const tablaAdmBebidas = document.getElementById("adm-tabla-bebidas");

        // Config teléfono
        const inTelefono = document.getElementById("conf-telefono");
        const btnGuardarTel = document.getElementById("conf-btn-guardar");

        let indiceEditandoPizza = null;
        let eliminarImagenEnEdicion = false;

        // ---------- acceso ----------
        btnValidar.addEventListener("click", () => {
            if (inputPin.value === PIN_GESTION) {
                seccionLogin.style.display = "none";
                seccionPanel.style.display = "block";
                inputPin.value = "";
            } else {
                alert("PIN incorrecto.");
            }
        });

        // ---------- utilidades ----------
        function resetFormPizza() {
            inNomPizza.value = "";
            inPrePizzaEntera.value = "";
            inPrePizzaMedia.value  = "";
            inDescPizza.value = "";
            inImgPizza.value = "";
            lblImgEstado.textContent = "Sin imagen cargada.";
            btnQuitarImg.style.display = "none";
            btnAgregarPizza.style.display = "inline-block";
            btnGuardarPizza.style.display = "none";
            btnCancelarPizza.style.display = "none";
            indiceEditandoPizza = null;
            eliminarImagenEnEdicion = false;
        }

        // ---------- render ----------
        function renderAdmin() {
            tablaAdmPizzas.innerHTML = "";
            tablaAdmBebidas.innerHTML = "";

            menuPizzas.forEach((p, idx) => {
                const tr = document.createElement("tr");
                tr.dataset.index = idx.toString();

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
                tr.dataset.index = idx.toString();
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

            // Teléfono
            inTelefono.value = telefono;
        }

        // ---------- alta pizza ----------
        btnAgregarPizza.addEventListener("click", () => {
            const nombre = inNomPizza.value.trim();
            const precioEntera = parseFloat(inPrePizzaEntera.value);
            const precioMedia  = parseFloat(inPrePizzaMedia.value);
            const desc   = inDescPizza.value.trim();
            const archivo = inImgPizza.files[0];

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
                guardarMenus();
                renderAdmin();
                resetFormPizza();
                return;
            }

            const lector = new FileReader();
            lector.onload = () => {
                const imgBase64 = lector.result;
                menuPizzas.push({
                    nombre,
                    precioEntera,
                    precioMedia,
                    descripcion: desc,
                    imagen: imgBase64
                });
                guardarMenus();
                renderAdmin();
                resetFormPizza();
            };
            lector.readAsDataURL(archivo);
        });

        // ---------- quitar imagen en edición ----------
        btnQuitarImg.addEventListener("click", () => {
            eliminarImagenEnEdicion = true;
            lblImgEstado.textContent = "Imagen eliminada. Si no carga otra, quedará sin foto.";
        });

        btnCancelarPizza.addEventListener("click", () => {
            resetFormPizza();
        });

        // ---------- guardar edición ----------
        btnGuardarPizza.addEventListener("click", () => {
            if (indiceEditandoPizza === null) return;
            const pizza = menuPizzas[indiceEditandoPizza];

            const nombre = inNomPizza.value.trim();
            const precioEntera = parseFloat(inPrePizzaEntera.value);
            const precioMedia  = parseFloat(inPrePizzaMedia.value);
            const desc   = inDescPizza.value.trim();
            const archivo = inImgPizza.files[0];

            if (!nombre) return alert("Ingrese el nombre.");
            if (isNaN(precioEntera) || precioEntera <= 0) return alert("Ingrese el precio de la pizza entera.");
            if (isNaN(precioMedia)  || precioMedia  <= 0) return alert("Ingrese el precio de la media pizza.");

            function aplicar(imagenNueva) {
                pizza.nombre = nombre;
                pizza.precioEntera = precioEntera;
                pizza.precioMedia  = precioMedia;
                pizza.descripcion  = desc;
                if (eliminarImagenEnEdicion) {
                    pizza.imagen = "";
                } else if (imagenNueva !== null) {
                    pizza.imagen = imagenNueva;
                }
                guardarMenus();
                renderAdmin();
                resetFormPizza();
            }

            if (archivo) {
                const lector = new FileReader();
                lector.onload = () => aplicar(lector.result);
                lector.readAsDataURL(archivo);
            } else {
                aplicar(null);
            }
        });

        // ---------- eventos tabla pizzas ----------
        tablaAdmPizzas.addEventListener("click", e => {
            const tr = e.target.closest("tr");
            if (!tr) return;
            const index = parseInt(tr.dataset.index);

            if (e.target.classList.contains("btn-eliminar")) {
                const pin = prompt("PIN admin para eliminar:");
                if (pin !== PIN_GESTION) {
                    alert("PIN incorrecto.");
                    return;
                }
                if (!confirm("¿Eliminar esta pizza?")) return;
                menuPizzas.splice(index, 1);
                guardarMenus();
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

        // ---------- bebidas ----------
        btnAgregarBebida.addEventListener("click", () => {
            const nombre = inNomBebida.value.trim();
            const precio = parseFloat(inPreBebida.value);
            if (!nombre) return alert("Ingrese el nombre.");
            if (isNaN(precio) || precio <= 0) return alert("Ingrese un precio válido.");

            menuBebidas.push({ nombre, precio });
            guardarMenus();
            renderAdmin();
            inNomBebida.value = "";
            inPreBebida.value = "";
        });

        tablaAdmBebidas.addEventListener("click", e => {
            const tr = e.target.closest("tr");
            if (!tr) return;
            const index = parseInt(tr.dataset.index);
            const bebida = menuBebidas[index];

            if (e.target.classList.contains("btn-eliminar")) {
                const pin = prompt("PIN admin para eliminar:");
                if (pin !== PIN_GESTION) {
                    alert("PIN incorrecto.");
                    return;
                }
                if (!confirm("¿Eliminar esta bebida?")) return;
                menuBebidas.splice(index, 1);
                guardarMenus();
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
                guardarMenus();
                renderAdmin();
            }
        });

        // ---------- teléfono ----------
        btnGuardarTel.addEventListener("click", () => {
            const val = inTelefono.value.trim();
            if (!val) {
                alert("Ingrese un número válido.");
                return;
            }
            telefono = val;
            guardarTelefono();
            alert("Teléfono actualizado. La próxima vez que abra la pantalla de pedidos usará este número.");
        });

        renderAdmin();
    }

    // =========================================================
    // ===============   INICIO GENERAL   ======================
    // =========================================================

    cargarDatos();
    guardarMenus();       // por si era la primera vez
    guardarTelefono();    // asegura que haya algo guardado

    if (page === "index") {
        initIndex();
    } else if (page === "gestion") {
        initGestion();
    }
});
