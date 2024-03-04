document.addEventListener('DOMContentLoaded', function() {
    const headers = document.querySelectorAll('#product-table th[data-type]');
    headers.forEach(header => {
        header.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            const index = Array.from(this.parentNode.children).indexOf(this);

            // Obtener los datos de la columna
            const rows = Array.from(document.querySelectorAll('#product-table tbody tr'));
            const sortedRows = rows.sort((a, b) => {
                let aValue = a.children[index].textContent.trim();
                let bValue = b.children[index].textContent.trim();

                // Convertir los valores según el tipo de datos
                if (type === 'number') {
                    return parseFloat(aValue) - parseFloat(bValue);
                } else if (type === 'date') {
                    aValue = new Date(aValue.split('-').reverse().join('-'));
                    bValue = new Date(bValue.split('-').reverse().join('-'));
                    return aValue - bValue;
                } else {
                    return aValue.localeCompare(bValue);
                }
            });

            // Invertir el orden si la columna ya está ordenada de manera ascendente
            if (this.classList.contains('sorted')) {
                sortedRows.reverse();
                this.classList.toggle('sorted');
            } else {
                this.parentNode.querySelectorAll('.sorted').forEach(el => {
                    el.classList.remove('sorted');
                });
                this.classList.add('sorted');
            }

            // Cambiar la flecha para mostrar el orden actual
            this.parentNode.querySelectorAll('.arrow').forEach(arrow => {
                arrow.classList.remove('desc');
            });
            this.querySelector('.arrow').classList.toggle('desc');

            // Volver a colocar las filas ordenadas en la tabla
            const tbody = document.querySelector('#product-table tbody');
            tbody.innerHTML = '';
            sortedRows.forEach(row => tbody.appendChild(row));
        });
    });
});















// Agregar listeners para los botones de editar
const editButtons = document.querySelectorAll('.edit-btn');
editButtons.forEach(btn => {
    btn.addEventListener('click', async function() {
        const productId = this.getAttribute('data-id');
        console.log('ID del producto a editar:', productId); // Agregar este console.log
        // Realizar solicitud GET para obtener los datos del producto
        try {
            const response = await fetch(`/obtener-producto/${productId}`);
            const data = await response.json();
            console.log('Datos del producto obtenidos:', data); // Agregar este console.log
            // Redirigir a la página de edición con los datos del producto
            // ...
        } catch (error) {
            console.error('Error al obtener los datos del producto:', error);
            alert('Error al obtener los datos del producto');
        }
    });
});


 // Agregar un evento de clic al botón de exportar
 document.getElementById('exportarBtn').addEventListener('click', async () => {
    try {
        // Realizar una solicitud GET al endpoint de exportación de Excel
        const response = await fetch('/exportar-excel');
        const blob = await response.blob();

        // Crear un enlace para descargar el archivo
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'productos.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error al exportar productos:', error);
        alert('Error al exportar productos');
    }
});





// Función para agregar listeners de eventos a los botones de editar
function agregarListenersEditar() {
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            console.log('ID del producto:', productId);
            window.location.href = `./Edit.html?id=${productId}`;
        });
    });
}

// Llama a la función para agregar listeners de eventos al cargar el dashboard
document.addEventListener('DOMContentLoaded', () => {
    cargarDashboard();
    agregarListenersEditar(); // Agrega listeners de eventos para los botones de editar
});





// Agrega un evento click al botón "Aplicar Filtros"
document.getElementById('aplicarFiltros').addEventListener('click', async (event) => {
    event.preventDefault();
    // Obtén los valores de los filtros
    const tipologia = document.getElementById('tipologia').value;
    const subtipologia = document.getElementById('subtipologia').value;
    const ubicacion = document.getElementById('ubicacion').value;
    const baja = document.getElementById('baja').value;
    const fechaBaja = document.getElementById('fechaBaja').value;
    const seguro = document.getElementById('seguro').value;
    const fechaSeguro = document.getElementById('fechaSeguro').value;
    const fechaCompra = document.getElementById('fechaCompra').value;
    const precioMaximo = parseFloat(document.getElementById('precioMaximo').value); 
    

    // Construye el objeto de filtros
    const filters = {
        Tipologia: tipologia,
        Subtipologia: subtipologia,
        Ubicacion: ubicacion,
        Baja: baja,
        FechaBaja: fechaBaja,
        Seguro: seguro,
        FechaSeguro: fechaSeguro,
        FechaCompra: fechaCompra,
        PrecioMaximo: precioMaximo 
    };

    // Realiza una solicitud POST al servidor con los filtros
    const response = await fetch('/public/filter', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(filters)
    });

    // Verifica si la solicitud fue exitosa
    if (response.ok) {
        // Obtiene los productos filtrados
        const productos = await response.json();
        // Limpia la tabla de productos
        document.querySelector('#product-table tbody').innerHTML = '';
        // Agrega los productos filtrados a la tabla
        productos.forEach(producto => {
            // Verifica si el precio máximo está definido y si el precio del producto está dentro del rango
            if (!precioMaximo || parseFloat(producto.Precio) <= precioMaximo) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${producto.Tipologia}</td>
                    <td>${producto.Subtipologia}</td>
                    <td>${producto.Nombre}</td>
                    <td>${producto.Descripcion}</td>
                    <td>${producto.Ubicacion}</td>
                    <td>${producto.Precio}€</td>
                    <td>${formatDate(producto.FechaCompra)}</td>
                    <td>${producto.Seguro}</td>
                    <td>${formatDate(producto.FechaSeguro)}</td>
                    <td>${producto.Baja}</td>
                    <td>${formatDate(producto.FechaBaja)}</td>
                    <td>${producto.Responsable}</td>
                    <td>${producto.Observaciones}</td>
                    <td><button class="edit-btn" data-id="${producto._id}">Editar</button></td>
                `;
                document.querySelector('#product-table tbody').appendChild(row);
            }
        });
        agregarListenersEditar();
    } else {
        // Si la solicitud falla, muestra un mensaje de error
        console.error('Error al obtener los productos filtrados');
    }
});




// Agrega un evento click al botón "Limpiar Filtros"
document.getElementById('limpiarFiltros').addEventListener('click', async (event) => {
    event.preventDefault();
    // Limpia los valores de los campos de filtro
    document.getElementById('tipologia').value = '';
    document.getElementById('subtipologia').value = '';
    document.getElementById('ubicacion').value = '';
    document.getElementById('baja').value = '';
    document.getElementById('fechaBaja').value = '';
    document.getElementById('seguro').value = '';
    document.getElementById('fechaSeguro').value = '';
    document.getElementById('fechaCompra').value = '';
    document.getElementById('precioMaximo').value = '';

    // Realiza una solicitud POST al servidor sin filtros para obtener todos los productos
    const response = await fetch('/public/filter', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    });

    // Verifica si la solicitud fue exitosa
    if (response.ok) {
        // Obtiene todos los productos
        const productos = await response.json();
        // Limpia la tabla de productos
        document.querySelector('#product-table tbody').innerHTML = '';
        // Agrega todos los productos a la tabla
        productos.forEach(producto => {
            const row = document.createElement('tr');
            row.innerHTML = `
            <td>${producto.Tipologia}</td>
            <td>${producto.Subtipologia}</td>
            <td>${producto.Nombre}</td>
            <td>${producto.Descripcion}</td>
            <td>${producto.Ubicacion}</td>
            <td>${producto.Precio}€</td>
            <td>${formatDate(producto.FechaCompra)}</td>
            <td>${producto.Seguro}</td>
            <td>${formatDate(producto.FechaSeguro)}</td>
            <td>${producto.Baja}</td>
            <td>${formatDate(producto.FechaBaja)}</td>
            <td>${producto.Responsable}</td>
            <td>${producto.Observaciones}</td>
            <td><button class="edit-btn" data-id="${producto._id}">Editar</button></td>
            `;
            document.querySelector('#product-table tbody').appendChild(row);
        });
        agregarListenersEditar();
    } else {
        // Si la solicitud falla, muestra un mensaje de error
        console.error('Error al obtener todos los productos');
    }
});






// Función para formatear la fecha en el formato "day/month/year"
function formatDate(dateString) {
    if (!dateString) {
        return ''; // Si la fecha no está definida, devolver un string vacío o el valor que prefieras
    }
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}



// Función para cargar el dashboard
async function cargarDashboard() {
    try {
        // Realizar una solicitud GET al servidor para obtener los productos
        const response = await fetch('/public/Dashboard');
        const productos = await response.json();

        // Obtener la tabla de productos
        const productTableBody = document.querySelector('#product-table tbody');

        // Limpiar la tabla de productos
        productTableBody.innerHTML = '';

        // Llenar la tabla con los productos recibidos
        productos.forEach(producto => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${producto.Tipologia}</td>
                <td>${producto.Subtipologia}</td>
                <td>${producto.Nombre}</td>
                <td>${producto.Descripcion}</td>
                <td>${producto.Ubicacion}</td>
                <td>${producto.Precio}€</td>
                <td>${formatDate(producto.FechaCompra)}</td>
                <td>${producto.Seguro}</td>
                <td>${formatDate(producto.FechaSeguro)}</td>
                <td>${producto.Baja}</td>
                <td>${formatDate(producto.FechaBaja)}</td>
                <td>${producto.Responsable}</td>
                <td>${producto.Observaciones}</td>
                <td><button class="edit-btn" data-id="${producto._id}">Editar</button></td>
            `;
            productTableBody.appendChild(row);
        });

        // Agregar listeners para los botones de editar
        const editButtons = document.querySelectorAll('.edit-btn');
        editButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                // Obtener el ID del producto del atributo data-id del botón
                const productId = this.getAttribute('data-id');
                console.log('ID del producto:', productId); // Asegurémonos de que se esté capturando el ID correctamente
                window.location.href = `./Edit.html?id=${productId}`;
            });
        });
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar el dashboard');
    }
}

// Cargar el dashboard cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', cargarDashboard);






// Obtener el campo de Observaciones del producto
const observaciones = producto.Observaciones;

// Crear un elemento de contenedor para las observaciones
const observacionesContainer = document.createElement('div');

// Convertir las observaciones en HTML y agregarlas al contenedor
observacionesContainer.innerHTML = observaciones;

// Agregar el contenedor al elemento donde se mostrarán las observaciones
row.querySelector('#observaciones-container').appendChild(observacionesContainer);





