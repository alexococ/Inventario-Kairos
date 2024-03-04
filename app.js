const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { Double, Decimal128 } = require('mongodb');
const XLSX = require('xlsx');
const exceljs  = require('exceljs'); 

const app = express();

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());



// Conexión a la base de datos MongoDB
mongoose.connect('mongodb://localhost:27017/inventario')
    .then(() => console.log('Conexión a MongoDB establecida'))
    .catch(err => console.error('Error al conectar a MongoDB:', err));


    app.use(express.static(path.join(__dirname, 'public')));

    // Ruta para cargar la página de inicio de sesión
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'Login.html'));
    });
    
    // Ruta para cargar la página del dashboard
    app.get('/Dashboard.html', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'Dashboard.html'));
    });




// Definir los esquemas de tus colecciones (usuarios y productos)
const usuarioSchema = new mongoose.Schema({
    correoUsuario: String,
    ContraseñaUsuario: String
});

const productoSchema = new mongoose.Schema({
Tipologia: String,
Subtipologia: String,
Nombre: String,
Descripcion: String,
Ubicacion: String,
Precio: String,
FechaCompra: Date,
Baja: String,   
FechaBaja: Date,
Seguro: String,
FechaSeguro: Date,
Responsable: String,
Observaciones: String
});

// Definir modelos basados en los esquemas
const Usuario = mongoose.model('Usuario', usuarioSchema);
const Producto = mongoose.model('Producto', productoSchema);



// Configurar middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());




// Rutas de tu aplicación
// Ruta para el login
const bcrypt = require('bcrypt');

app.post('/login', async (req, res) => {
    const { correoUsuario, ContraseñaUsuario } = req.body;
    console.log('Datos recibidos:', correoUsuario, ContraseñaUsuario);
       try {
        const usuario = await Usuario.findOne({ correoUsuario });
        console.log('Usuario encontrado:', usuario);
        if (!usuario) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }
        const passwordMatch = await Usuario.findOne({ContraseñaUsuario});
        

        if (passwordMatch) {
            // Las credenciales son correctas, redirecciona al dashboard
            return res.status(200).redirect('Dashboard.html');
        } 
        else {
            // Las credenciales son incorrectas
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }
    } catch (error) {
        // Error en el servidor
        console.error('Error en el servidor:', error);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
});

  




// Ruta para el dashboard (ver productos)
app.get('/public/Dashboard', async (req, res) => {
    try {
        // Obtener todos los productos de la base de datos
        const productos = await Producto.find();
        res.json(productos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



// Función para generar el archivo Excel
const generarExcel = async () => {
    const productos = await Producto.find(); // Obtener todos los productos de la base de datos

    // Crear un nuevo libro de Excel
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Productos');

    // Agregar encabezados de columnas
    worksheet.addRow(['Tipología', 'Subtipología', 'Nombre', 'Descripción', 'Ubicación', 'Precio', 'Fecha de Compra', 'Seguro', 'Fecha de Seguro', 'Baja', 'Fecha de Baja', 'Responsable', 'Observaciones']);

    // Agregar datos de productos
    productos.forEach(producto => {
        const { Tipologia, Subtipologia, Nombre, Descripcion, Ubicacion, Precio, FechaCompra, Seguro, FechaSeguro, Baja, FechaBaja, Responsable, Observaciones } = producto;
        worksheet.addRow([Tipologia, Subtipologia, Nombre, Descripcion, Ubicacion, Precio, FechaCompra, Seguro, FechaSeguro, Baja, FechaBaja, Responsable, Observaciones]);
    });

    // Guardar el libro de Excel
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
};

// Ruta para exportar los productos como Excel
app.get('/exportar-excel', async (req, res) => {
    try {
        const excelBuffer = await generarExcel();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=productos.xlsx');
        res.send(excelBuffer);
    } catch (error) {
        console.error('Error al exportar productos a Excel:', error);
        res.status(500).json({ error: 'Error al exportar productos a Excel' });
    }
});





// Ruta para filtrar productos
app.post('/public/filter', async (req, res) => {
    // Obtén los valores de los filtros del cuerpo de la solicitud
    const filters = req.body;

    try {
        // Construye la consulta a la base de datos utilizando los filtros recibidos
        let query = {};

        if (filters.Tipologia) {
            query.Tipologia = filters.Tipologia;
        }
        if (filters.Subtipologia) {
            query.Subtipologia = filters.Subtipologia;
        }
        if (filters.Ubicacion) {
            query.Ubicacion = filters.Ubicacion;
        }
        if (filters.Baja) {
            query.Baja = filters.Baja;
        }
        if (filters.FechaBaja) {
            const fechaBaja = new Date(parseInt(filters.FechaBaja), 0, 1);
            query.FechaBaja = { $gte: fechaBaja, $lt: new Date(fechaBaja.getFullYear() + 1, 0, 1) };
        }
        if (filters.Seguro) {
            query.Seguro = filters.Seguro;
        }
        if (filters.FechaSeguro) {
            const fechaSeguro = new Date(parseInt(filters.FechaSeguro), 0, 1);
            query.FechaSeguro = { $gte: fechaSeguro, $lt: new Date(fechaSeguro.getFullYear() + 1, 0, 1) };
        }
        if (filters.FechaCompra) {
            const fechaCompra = new Date(parseInt(filters.FechaCompra), 0, 1);
            query.FechaCompra = { $gte: fechaCompra, $lt: new Date(fechaCompra.getFullYear() + 1, 0, 1) };
        }
        
        // Filtrar por precio máximo
        if (filters.PrecioMaximo) {
            query.Precio = { $lte: parseFloat(filters.PrecioMaximo) };
        }

        // Realiza la consulta a la base de datos utilizando los filtros recibidos
        const productos = await Producto.find(query);
        res.json(productos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});





// Ruta para añadir un producto
app.post('/public/Add', async (req, res) => {
    const { Tipologia, Subtipologia, Nombre, Descripcion, Ubicacion, Precio, FechaCompra, Seguro, FechaSeguro, Baja, FechaBaja, Responsable, Observaciones } = req.body;

    try {
        // Formatear la fecha de compra en el formato "day/month/year"
        const fechaCompraFormateada = new Date(FechaCompra);

        // Crear un nuevo producto con la fecha formateada
        const producto = new Producto({ Tipologia, Subtipologia, Nombre, Descripcion, Ubicacion, Precio, FechaCompra: fechaCompraFormateada, Seguro, FechaSeguro, Baja, FechaBaja, Responsable, Observaciones });

        // Guardar el producto en la base de datos
        const nuevoProducto = await producto.save();
        
        // Redireccionar al dashboard después de agregar el producto
        res.redirect('/Dashboard.html');
        
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});




// Ruta para obtener los datos de un producto por su ID
app.get('/obtener-producto/:id', async (req, res) => {
    try {
        // Obtener el ID del producto de la solicitud
        const productId = req.params.id;
        console.log('ID del producto a obtener:', productId); // Agregar este console.log

        // Buscar el producto en la base de datos por su ID
        const producto = await Producto.findById(productId);
        console.log('Producto encontrado en la base de datos:', producto); // Agregar este console.log

        // Verificar si el producto existe
        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Enviar los datos del producto como respuesta
        res.json(producto);
    } catch (error) {
        // Manejar errores
        console.error('Error al obtener datos del producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.put('/editar-producto/:id', async (req, res) => {
    const productId = req.params.id;
    const updatedProductData = req.body;

    try {
        const updatedProduct = await Producto.findByIdAndUpdate(productId, updatedProductData, { new: true });

        if (!updatedProduct) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        return res.status(200).json(updatedProduct);
    } catch (error) {
        console.error('Error al editar el producto:', error);
        return res.status(500).json({ error: 'Error al editar el producto' });
    }
});















const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor en ejecución en el puerto ${PORT}`);
});

