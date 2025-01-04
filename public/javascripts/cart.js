const updateCartCount = async () => {
    const response = await fetch('/cart'); // Fetch current cart
    const { cartItems } = await response.json();

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').innerText = totalItems;
};

// Call this function after adding a product to the cart
button.addEventListener('click', async (event) => {
    const productId = event.target.dataset.productId;
    const quantity = 1;

    try {
        const response = await fetch('/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, quantity }),
        });

        if (response.ok) {
            alert('Product added to cart!');
            updateCartCount();
        } else {
            alert('Failed to add product to cart.');
        }
    } catch (error) {
        console.error('Error adding product to cart:', error);
        alert('Something went wrong.');
    }
});

async function updateQuantity(cartId, newQuantity) {
    await fetch('/cart/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cartId, quantity: newQuantity })
    });

    location.reload();
}

async function removeCartItem(cartId) {
    await fetch(`/cart/delete/${cartId}`, { method: 'DELETE' });
    location.reload();
}