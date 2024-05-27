// array de productos dinámico
class Producto{
  constructor(nombre, id, precio, stock, descripcion){
      this.nombre = nombre;
      this.id = id;
      this.precio = precio;
      this.stock = stock;
      this.descripcion = descripcion;
  }
}
let productosBase = [];

// Cargar los datos desde el archivo Jsson
const pedirDatos = async () => {
  try {
    const response = await fetch('./json/productosBase.json');
    const data = await response.json();
    productosBase = data.map(producto => new Producto(producto.nombre, producto.id, producto.precio, producto.stock, producto.descripcion));
  } catch (error) {
    console.error('Revisar el Error al cargar los datos desde el JSON:', error);
  }
}


const productosDiv = document.getElementById('itemProducto');
const carritoUl = document.getElementById('itemsCompra');
let carrito = [];




// Muestra los productos en la pagina principal en un div usando card de Boostrap
// Muestra via modal los productos seleccionados
function mostrarProductos() {
  
  productosDiv.innerHTML = '';
  productosBase.forEach(itemProducto => {
    const productoDiv = document.createElement("div");
    productoDiv.classList.add("card", "col-xs");
    productoDiv.style = "width: 300px; height: 550px; margin:10px"
    productoDiv.innerHTML = `
      <div class="container text-center">
        <img src="./imgProductos/${itemProducto.id}.png" class="card-img-top"  alt="${itemProducto.nombre}">  
      </div>
      <div class="card-body">
        <h5 class="card-title">${itemProducto.nombre}</h5>
        <p class="card-text">Precio: $${itemProducto.precio}</p>
        <p class="card-text" id="prodStock${itemProducto.id}">Stock: ${itemProducto.stock}</p>
        <form  id="form${itemProducto.id}">
          <div class="row g-1">
            <div class="col-auto">    
              Cantidad:
            </div>
            <div class="col-4">
              <input class="form-control form-control-sm" type="number" min="0" max="${itemProducto.stock}" placeholder="0" id="contador${itemProducto.id}">
            </div>
            <div class="col-auto">
              <button class="btn btn-primary btn-sm" onclick="agregarCarrito('${itemProducto.id}',contador${itemProducto.id}.value )">Agregar</button>
            </div>
          </div>
        <div class="row p-2">
          <button type="button" class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#modalPago">
          Ver Carrito
          </button>
        </div>
      </div>
    </form>
    `;
    productosDiv.appendChild(productoDiv);
  });
}

function agregarCarrito(id, cantidad) {
  const itemProducto = productosBase.find(p => p.id === id);
  // valida si ingresa un valor mayor a 0, ya se eliminó la cantidad negativa y mayor al stock en los imputs
  // Ahora si pone agregar sin poner cantidad mayor a cero da error y no detiene la app

if (cantidad != 0) {
  if (itemProducto && itemProducto.stock > 0) {
    if (cantidad > 0 && cantidad <= itemProducto.stock) {
      const carritoItem = carrito.find(item => item.id === id);
      if (carritoItem) {
        carritoItem.cantidad += parseInt(cantidad);
      } else {
        // agregamos cantidad en carrito
        carrito.push({ ...itemProducto, cantidad: parseInt(cantidad) });
      }
      // disminuimos el stock para actualizarlo en la pagina principal
      itemProducto.stock -= parseInt(cantidad);
      // mostramos el stock actualizado, cargamos la compra y guardamos en el local store
      mostrarProductos();
      itemCompra();
      guardarCarritoEnLocalStorage();    
      //Aviso de que se agrego correctamente que desaparece solo
      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2200,
        timerProgressBar: true,
      });      
      Toast.fire({
        icon: "success",
        title: "Producto Agregado"
      });
      // Mensajes de errores
    } else {
      Swal.fire({
        title: "Alerta",
        text: "Seleccione una cantidad valida del producto",
        icon: "warning"
        });
    }
  } 
    else {
    Swal.fire({
      title: "Error",
      text: "Producto sin Stock",
      icon: "error"
      });
  }

}
else {
  //error no se selecciono cantidad de producto
  Swal.fire({
    title: "Error",
    text: "Ingrese una cantidad valida del Producto",
    icon: "warning"
  });
  mostrarProductos();
}

}

// Guarda en el Almacenamiento Local
function guardarCarritoEnLocalStorage() {
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

// lista los productos comprados, su cantidad y precio
function itemCompra() {
  carritoUl.innerHTML = '';
  carrito.forEach(itemProducto => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
    li.innerHTML = `
    ${itemProducto.cantidad} - ${itemProducto.nombre} - $${itemProducto.precio * itemProducto.cantidad}
      <button class="btn btn-danger btn-sm" onclick="eliminarProductoCarrito('${itemProducto.id}')">Eliminar Item</button>
    `;
    carritoUl.appendChild(li);
  });
}

// eliminar pruducto del carrito
function eliminarProductoCarrito(id) {
  const index = carrito.findIndex(item => item.id === id);
  if (index !== -1) {
    const item = carrito[index];
    const productoBase = productosBase.find(p => p.id === id);
    productoBase.stock += item.cantidad;
    carrito.splice(index, 1);
    // actualizamos stock despues de eliminar el producto del carrito
    mostrarProductos();
    itemCompra();
    guardarCarritoEnLocalStorage();
  }
}

// Leer almacenamiento local
function cargarCarritoDesdeLocalStorage() {
  const carritoGuardado = localStorage.getItem('carrito');
  if (carritoGuardado) {
    carrito = JSON.parse(carritoGuardado);
    itemCompra();
  }
}

// Eliminar todos los productos del carrito
function vaciarCarrito () {
  localStorage.removeItem('carrito');
  location.reload();
}

// Previo a Finalizar la compra, muestra el detalle y calcula el total
function finalizarCarrito () {
  let total = 0;
  carrito.forEach(itemProducto => {
  total += itemProducto.precio * itemProducto.cantidad;
  });
  // verifico si compro algo sino muestro aviso de que no hay productos agregados
  if (total > 0) {
  valorFinalCompra.innerHTML = `
    <div class="container p-4">
      <div class="alert alert-success p-1" role="alert">
        <h4 class="alert-heading">Finalizar La compra</h4>
        <p>El valor total de la compra es: $${total}</p>  
        <hr>
        <p class="mb-0">Ingrese sus datos para que le enviemos el detalle de su pedido y metodos de pago.</p>
        <form  id="formCompra">
          <div class="g-4">
            <div class="row p-1">
              <div class="col-sm-10 col-lg-5 col-xl-6 ">
                <input type="nombre" class="form-control frm" placeholder="Nombre" id="nombre">
              </div>
            </div>
            <div class="row p-1">
              <div class="col-sm-10 col-lg-5 col-xl-6">
                <input type="email" class="form-control" placeholder="nombre@ejemplo.com" id="email">
              </div>
            </div>
            <div class="row p-1">
              <div class="col-1">
                <button type="button" class="btn btn-success" onclick="enviarCarrito()">Enviar</button>
              </div>
            </div>
          </div>
        </form>  
      </div>
    
    </div>
    `;
  // Elimino boton de finalizar compra porque y doy posibilidad de seguir comprando
  botonesFinalCompra.innerHTML = `
      <button type="button" class="btn btn-outline-secondary btn-sm" data-bs-dismiss="modal" onclick="limpiarCuenta()">Seguir Comprando</button>
      <button type="button" class="btn btn-outline-danger btn-sm" onclick="vaciarCarrito()" >Limpiar Carrito</button>     
  `;
  }else {
    // aviso de carrito vacio
    valorFinalCompra.innerHTML = `
    <div class="container p-4">
      <div class="alert alert-success p-1" role="alert">
        <h4 class="alert-heading">No agrego ningun producto</h4>
        <p>Vuelva a la pagina principal y seleccione que producto desea comprar</p>  
        <hr>
        <p class="mb-0 small">Carrito de Compras JS 1.1</p>
      </div>
    </div>
    `;
  botonesFinalCompra.innerHTML = `
    <div id="botonesFinalCompra">
    <button type="button" class="btn btn-success btn-sm" data-bs-dismiss="modal" onclick="limpiarCuentaModal()" >Seguir Comprando</button>   
    </div>
    `;
  }
}

// Funciones para eliminar el modal que muestra la cuenta del total cuando el usuario prefiere seguir comprando, 
// asi no tengo que agregar un boton de actualizar carrito, tambien actualizo listado de botones
function limpiarCuenta(){
  valorFinalCompra.innerHTML = `
  <div class="container p-4">
  </div>
  `;
  botonesFinalCompra.innerHTML = `
    <button type="button" class="btn btn-success btn-sm" data-bs-dismiss="modal">Seguir Comprando</button>
    <button type="button" class="btn btn-danger btn-sm" onclick="vaciarCarrito()" >Limpiar Carrito</button>
    <button type="button" class="btn btn-primary btn-sm" onclick="finalizarCarrito()">Finalizar Compra</button>
  `;
}
function limpiarCuentaModal(){
  modalPago.innerHTML = `
<div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h1 class="modal-title fs-4" id="modalFinal">Carrito de Compras</h1>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <h2>Resumen de Compra</h2>
          <div class="container">
          <!-- Visualizador de Productos--> 
            <div class="list-group" id="itemsCompra">
            </div>
          </div>
          <!-- Visualizador de Total-->
          <div id="valorFinalCompra"></div>
          <!-- Botones actualizables Cerrar Finalizar Borrar-->
          <div id="botonesFinalCompra">
          <button type="button" class="btn btn-success btn-sm" data-bs-dismiss="modal">Seguir Comprando</button>
          <button type="button" class="btn btn-danger btn-sm" onclick="vaciarCarrito()" >Limpiar Carrito</button>
          <button type="button" class="btn btn-primary btn-sm" onclick="finalizarCarrito()">Finalizar Compra</button>
          </div>
        </div>
      </div>
    </div>
    `;
}

// Mensaje de agradecimento
function enviarCarrito(){
  modalPago.innerHTML = `
  <div class="container p-4 text-center">
    <div class="alert alert-success p-1" role="alert">
      <h3 class="alert-heading">Compra Finalizada</h3>
      <div>
      <img src="./img/gracias.png" class="mx-auto d-block w-25 p-2" alt="Saludo de agradecimiento por la compra"> 
      <strong>Sanjay, ayuda a esta persona con su compra, y mientras lo haces...kenkere kumbaya, baya </strong>
      </div>
      <button type="button" class="btn btn-success btn-sm" onclick="vaciarCarrito()">Muchas gracias, vuelva prontos!</button>
    </div>
  </div>
  `;
}
  
// Testeo
const app = async  ()=>{
 //cargarDatosDesdeJSON();
  await pedirDatos();
  mostrarProductos();
  cargarCarritoDesdeLocalStorage();
 
}

//ejecuto app
app()