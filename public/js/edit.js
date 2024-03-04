const editProductForm = document.getElementById('edit-product-form');

editProductForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const formData = new FormData(editProductForm);

    const editedProductData = {};
    formData.forEach((value, key) => {
        editedProductData[key] = value;
    });

    try {
        const response = await fetch(`/editar-producto/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(editedProductData)
        });

        if (response.ok) {
            console.log('Producto editado con éxito');
            window.location.href = '/Dashboard.html'; // Redireccionar al dashboard después de editar el producto
        } else {
            console.error('Error al editar el producto');
        }
    } catch (error) {
        console.error('Error de red:', error);
    }
});
    