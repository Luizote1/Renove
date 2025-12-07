// Sistema de Gerenciamento de Produtos
class ProductManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.cart = [];
        this.init();
    }

    init() {
        this.loadProducts();
        this.setupEventListeners();
        this.renderProducts();
        this.loadCart();
    }

    loadProducts() {
        // Dados dos produtos (em um projeto real, viriam de uma API)
        this.products = [
            {
                id: 1,
                name: "Creme Facial Hidratante",
                category: "skincare",
                price: 89.90,
                rating: 4.8,
                image: "Produtos/P1 - Creme Facial.png",
                description: "Creme facial hidratante com vitamina C e ácido hialurônico para pele radiante e hidratada.",
                ingredients: "Água, Glicerina, Vitamina C, Ácido Hialurônico, Manteiga de Karité",
                volume: "50ml",
                skinType: "Todos os tipos de pele"
            },
            {
                id: 2,
                name: "Base Líquida Profissional",
                category: "maquiagem",
                price: 129.90,
                rating: 4.6,
                image: "Produtos/P2 - Base Liquida.png",
                description: "Base líquida de longa duração com acabamento natural e cobertura média.",
                ingredients: "Água, Silicones, Pigmentos minerais, Vitamina E",
                volume: "30ml",
                skinType: "Todos os tipos de pele"
            },
            {
                id: 3,
                name: "Perfume Hypnose",
                category: "perfume",
                price: 299.90,
                rating: 4.9,
                image: "Produtos/P3 - hypnose.png",
                description: "Fragrância feminina sofisticada com notas de jasmim, baunilha e âmbar.",
                ingredients: "Álcool, Fragrância, Água, Conservantes",
                volume: "50ml",
                skinType: "Uso externo"
            },
            {
                id: 4,
                name: "Shampoo Hidratante Lily",
                category: "cabelo",
                price: 45.90,
                rating: 4.7,
                image: "Produtos/P4 - Lily.png",
                description: "Shampoo hidratante com óleo de argan e proteínas para cabelos sedosos e brilhantes.",
                ingredients: "Água, Lauril Sulfato de Sódio, Óleo de Argan, Proteínas de Queratina",
                volume: "250ml",
                skinType: "Todos os tipos de cabelo"
            },
            {
                id: 5,
                name: "Sérum Antirrugas",
                category: "skincare",
                price: 159.90,
                rating: 4.9,
                image: "Produtos/P5 - Sérum.png",
                description: "Sérum concentrado com retinol e peptídeos para reduzir linhas de expressão.",
                ingredients: "Água, Retinol, Peptídeos, Ácido Hialurônico, Vitamina E",
                volume: "30ml",
                skinType: "Pele madura"
            },
            {
                id: 6,
                name: "Paleta de Sombras",
                category: "maquiagem",
                price: 89.90,
                rating: 4.5,
                image: "Produtos/P6 - Paleta Sombra.png",
                description: "Paleta com 18 sombras matte e metálicas para looks versáteis.",
                ingredients: "Talc, Mica, Pigmentos, Vitamina E",
                volume: "18 sombras",
                skinType: "Uso externo"
            }
        ];
        this.filteredProducts = [...this.products];
    }

    setupEventListeners() {
        // Filtros
        document.getElementById('searchInput').addEventListener('input', () => this.applyFilters());
        document.getElementById('categoryFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('priceFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('sortSelect').addEventListener('change', () => this.sortProducts());
        
        // Busca em tempo real
        let searchTimeout;
        document.getElementById('searchInput').addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => this.applyFilters(), 300);
        });
    }

    applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const category = document.getElementById('categoryFilter').value;
        const priceRange = document.getElementById('priceFilter').value;

        this.filteredProducts = this.products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm) || 
                                product.description.toLowerCase().includes(searchTerm);
            const matchesCategory = !category || product.category === category;
            const matchesPrice = this.matchesPriceRange(product.price, priceRange);

            return matchesSearch && matchesCategory && matchesPrice;
        });

        this.renderProducts();
        this.updateResultsCount();
    }

    matchesPriceRange(price, range) {
        if (!range) return true;
        
        switch(range) {
            case '0-50': return price <= 50;
            case '50-100': return price > 50 && price <= 100;
            case '100-200': return price > 100 && price <= 200;
            case '200+': return price > 200;
            default: return true;
        }
    }

    sortProducts() {
        const sortBy = document.getElementById('sortSelect').value;
        
        this.filteredProducts.sort((a, b) => {
            switch(sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'price-low':
                    return a.price - b.price;
                case 'price-high':
                    return b.price - a.price;
                case 'rating':
                    return b.rating - a.rating;
                default:
                    return 0;
            }
        });

        this.renderProducts();
    }

    renderProducts() {
        const grid = document.getElementById('productsGrid');
        grid.innerHTML = '';

        if (this.filteredProducts.length === 0) {
            grid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-search display-1 text-muted"></i>
                    <h3 class="mt-3">Nenhum produto encontrado</h3>
                    <p class="text-muted">Tente ajustar os filtros de busca</p>
                </div>
            `;
            return;
        }

        this.filteredProducts.forEach(product => {
            const productCard = this.createProductCard(product);
            grid.appendChild(productCard);
        });
    }

    createProductCard(product) {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        
        col.innerHTML = `
            <div class="card product-card shadow-sm h-100">
                <div class="position-relative overflow-hidden">
                    <img src="${product.image}" class="card-img-top" alt="${product.name}" style="height: 220px; object-fit: contain; padding: 1.5rem; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
                    <div class="position-absolute top-0 end-0 m-3">
                        <span class="badge" style="background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%); color: #2c3e50; font-weight: 600; padding: 0.5rem 0.75rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);">
                            <i class="bi bi-star-fill me-1"></i> ${product.rating}
                        </span>
                    </div>
                    <div class="position-absolute top-0 start-0 m-3">
                        <span class="badge" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: 600; padding: 0.5rem 0.75rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                            ${product.category}
                        </span>
                    </div>
                </div>
                <div class="card-body d-flex flex-column p-4">
                    <h5 class="card-title fw-bold mb-3" style="color: #2c3e50;">${product.name}</h5>
                    <p class="card-text text-muted mb-4" style="line-height: 1.6;">${product.description.substring(0, 80)}...</p>
                    <div class="mt-auto">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="h4 fw-bold mb-0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">R$ ${product.price.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div class="d-grid gap-3">
                            <button class="btn btn-outline-primary btn-lg" onclick="productManager.viewProduct(${product.id})" style="border-radius: 12px; font-weight: 600; border-width: 2px;">
                                <i class="bi bi-eye me-2"></i> Ver Detalhes
                            </button>
                            <button class="btn btn-primary btn-lg" onclick="productManager.addToCart(${product.id})" style="border-radius: 12px; font-weight: 600; border: none;">
                                <i class="bi bi-cart-plus me-2"></i> Adicionar ao Carrinho
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        return col;
    }

    viewProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const modalBody = document.getElementById('productModalBody');
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <img src="${product.image}" class="img-fluid rounded" alt="${product.name}">
                </div>
                <div class="col-md-6">
                    <h4>${product.name}</h4>
                    <div class="mb-3">
                        <span class="badge bg-warning text-dark me-2">
                            <i class="bi bi-star-fill"></i> ${product.rating}
                        </span>
                        <span class="badge bg-secondary">${product.category}</span>
                    </div>
                    <p class="text-muted">${product.description}</p>
                    
                    <div class="mb-3">
                        <strong>Ingredientes:</strong>
                        <p class="small text-muted">${product.ingredients}</p>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-6">
                            <strong>Volume:</strong>
                            <p class="mb-0">${product.volume}</p>
                        </div>
                        <div class="col-6">
                            <strong>Tipo de Pele:</strong>
                            <p class="mb-0">${product.skinType}</p>
                        </div>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center">
                        <h3 class="text-primary mb-0">R$ ${product.price.toFixed(2).replace('.', ',')}</h3>
                        <button class="btn btn-primary btn-lg" onclick="productManager.addToCart(${product.id})">
                            <i class="bi bi-cart-plus"></i> Adicionar ao Carrinho
                        </button>
                    </div>
                </div>
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('productModal'));
        modal.show();
    }

    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const existingItem = this.cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                ...product,
                quantity: 1
            });
        }

        this.saveCart();
        this.updateCartDisplay();
        this.showNotification(`${product.name} adicionado ao carrinho!`);
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartDisplay();
    }

    updateQuantity(productId, change) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                this.saveCart();
                this.updateCartDisplay();
            }
        }
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
        this.updateCartCount();
    }

    loadCart() {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            this.cart = JSON.parse(savedCart);
            this.updateCartDisplay();
        }
    }

    updateCartCount() {
        const count = this.cart.reduce((total, item) => total + item.quantity, 0);
        document.getElementById('cartCount').textContent = count;
    }

    updateCartDisplay() {
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        
        if (this.cart.length === 0) {
            cartItems.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-cart3 display-4 text-muted"></i>
                    <p class="mt-2 text-muted">Seu carrinho está vazio</p>
                </div>
            `;
            cartTotal.textContent = 'R$ 0,00';
            return;
        }

        cartItems.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <div class="d-flex align-items-center">
                    <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: contain;" class="me-3">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${item.name}</h6>
                        <p class="mb-1 text-muted">R$ ${item.price.toFixed(2).replace('.', ',')}</p>
                        <div class="d-flex align-items-center">
                            <button class="btn btn-sm btn-outline-secondary" onclick="productManager.updateQuantity(${item.id}, -1)">-</button>
                            <span class="mx-2">${item.quantity}</span>
                            <button class="btn btn-sm btn-outline-secondary" onclick="productManager.updateQuantity(${item.id}, 1)">+</button>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-outline-danger ms-2" onclick="productManager.removeFromCart(${item.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }

    updateResultsCount() {
        const count = this.filteredProducts.length;
        const total = this.products.length;
        document.getElementById('resultsCount').textContent = 
            count === total ? 'Mostrando todos os produtos' : `Mostrando ${count} de ${total} produtos`;
    }

    showNotification(message) {
        // Cria uma notificação toast simples
        const toast = document.createElement('div');
        toast.className = 'position-fixed top-0 end-0 p-3';
        toast.style.zIndex = '9999';
        toast.innerHTML = `
            <div class="toast show" role="alert">
                <div class="toast-header">
                    <strong class="me-auto">Renove</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Funções globais para compatibilidade com onclick
function applyFilters() {
    productManager.applyFilters();
}

function sortProducts() {
    productManager.sortProducts();
}

function checkout() {
    if (productManager.cart.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }
    
    // Fecha o offcanvas do carrinho
    const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('cartOffcanvas'));
    if (offcanvas) {
        offcanvas.hide();
    }
    
    // Redireciona para a página de checkout
    window.location.href = 'checkout.html';
}

// Inicializa o gerenciador de produtos quando o DOM estiver carregado
let productManager;
document.addEventListener('DOMContentLoaded', () => {
    productManager = new ProductManager();
});
