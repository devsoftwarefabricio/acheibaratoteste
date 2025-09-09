// =================================================================================
// 1. CONFIGURAÇÃO DO FIREBASE
// =================================================================================

// ATENÇÃO: Cole aqui as configurações do seu projeto Firebase
const firebaseConfig = {
  apiKey: "SEU_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// =================================================================================
// 2. SELEÇÃO DE ELEMENTOS DO DOM E VARIÁVEIS GLOBAIS
// =================================================================================

const loadingIndicator = document.getElementById('loading');
const defaultCarouselsContainer = document.getElementById('defaultCarousels');
let swiperInstances = {};

// =================================================================================
// 3. FUNÇÕES AUXILIARES (HELPERS)
// =================================================================================

function sanitizeHTML(str) {
    if (!str) return '';
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

function formatPrice(price) {
    const numPrice = parseFloat(price);
    if (!isNaN(numPrice)) {
        return `R$ ${numPrice.toFixed(2).replace('.', ',')}`;
    }
    return sanitizeHTML(price);
}

function generateStarRating(rating, reviews) {
    const numRating = parseFloat(rating) || 0;
    const numReviews = parseInt(reviews) || 0;
    let stars = '';
    let fullStars = Math.floor(numRating);
    let halfStar = numRating % 1 !== 0;
    for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star"></i>';
    if (halfStar) stars += '<i class="fas fa-star-half-alt"></i>';
    for (let i = 0; i < 5 - Math.ceil(numRating); i++) stars += '<i class="far fa-star"></i>';
    return `<div class="star-rating flex items-center" title="${numRating} de 5 estrelas">${stars} <span class="text-xs text-gray-500 ml-2">(${numReviews})</span></div>`;
}

function generateContactLinks(contact) {
    let links = '';
    if (contact?.whatsapp) links += `<a href="https://wa.me/${contact.whatsapp}" target="_blank" rel="noopener noreferrer" title="WhatsApp" class="contact-icon whatsapp-icon text-gray-500"><i class="fab fa-whatsapp fa-lg"></i></a>`;
    if (contact?.facebook) links += `<a href="${contact.facebook}" target="_blank" rel="noopener noreferrer" title="Facebook" class="contact-icon facebook-icon text-gray-500"><i class="fab fa-facebook fa-lg"></i></a>`;
    if (contact?.instagram) links += `<a href="${contact.instagram}" target="_blank" rel="noopener noreferrer" title="Instagram" class="contact-icon instagram-icon text-gray-500"><i class="fab fa-instagram fa-lg"></i></a>`;
    if (contact?.website) links += `<a href="${contact.website}" target="_blank" rel="noopener noreferrer" title="Website" class="contact-icon website-icon text-gray-500"><i class="fas fa-globe fa-lg"></i></a>`;
    return links;
}

// =================================================================================
// 4. LÓGICA DE RENDERIZAÇÃO
// =================================================================================

function createCard(item) {
    const primaryLink = item.contact?.whatsapp ? `https://wa.me/${item.contact.whatsapp}` : (item.contact?.website || '#');
    const buttonText = item.contact?.whatsapp ? 'Chamar no WhatsApp' : 'Ver Oferta';

    return `
        <div class="swiper-slide">
            <div class="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 w-full max-w-sm mx-auto flex flex-col">
                <img src="${sanitizeHTML(item.image)}" alt="${sanitizeHTML(item.name)}" class="w-full h-48 object-cover">
                <div class="p-5 flex flex-col flex-grow">
                    <div class="flex-grow">
                        <span class="text-xs font-semibold text-blue-600 bg-blue-100 py-1 px-3 rounded-full">${sanitizeHTML(item.category)}</span>
                        <h3 class="text-lg font-bold mt-3 text-gray-800 truncate">${sanitizeHTML(item.name)}</h3>
                        <p class="text-sm text-gray-500 mb-2">por ${sanitizeHTML(item.company)}</p>
                        ${generateStarRating(item.rating, item.reviews)}
                        <p class="text-gray-600 text-sm my-4 h-10 overflow-hidden">${sanitizeHTML(item.description)}</p>
                    </div>
                    <div class="mt-auto pt-4 border-t border-gray-100">
                        <div class="flex justify-between items-center mb-4">
                            <span class="text-xl font-extrabold text-gray-900">${formatPrice(item.price)}</span>
                            <div class="flex items-center space-x-3">${generateContactLinks(item.contact)}</div>
                        </div>
                        <a href="${primaryLink}" target="_blank" rel="noopener noreferrer" class="block w-full text-center bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition duration-300 text-sm">
                            ${sanitizeHTML(buttonText)}
                        </a>
                    </div>
                </div>
            </div>
        </div>`;
}

function renderCarousel(wrapperId, items) {
    const wrapper = document.getElementById(wrapperId);
    if (wrapper) {
        wrapper.innerHTML = items.map(createCard).join('');
    }
}

function initSwiper(selector) {
    if (swiperInstances[selector]) {
        swiperInstances[selector].destroy(true, true);
    }
    swiperInstances[selector] = new Swiper(selector, {
        loop: false,
        slidesPerView: 1,
        spaceBetween: 30,
        pagination: { el: `${selector} .swiper-pagination`, clickable: true },
        navigation: { nextEl: `${selector} .swiper-button-next`, prevEl: `${selector} .swiper-button-prev` },
        breakpoints: { 640: { slidesView: 2 }, 1024: { slidesPerView: 3 }, 1280: { slidesPerView: 4 } }
    });
}

// =================================================================================
// 5. LÓGICA PRINCIPAL DA APLICAÇÃO
// =================================================================================

async function fetchDataAndRender() {
    try {
        const snapshot = await db.collection("products").get();
        const allItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const featured = allItems.filter(item => item.featured);
        const products = allItems.filter(item => item.type === 'produto' && !item.featured);
        const services = allItems.filter(item => item.type === 'serviço' && !item.featured);

        // Oculta o loading e mostra os carrosséis
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        if (defaultCarouselsContainer) defaultCarouselsContainer.classList.remove('hidden');

        // Renderiza cada seção se houver itens
        const sections = [
            { id: 'destaques', data: featured },
            { id: 'produtos', data: products },
            { id: 'servicos', data: services }
        ];

        sections.forEach(section => {
            const sectionEl = document.getElementById(`${section.id}-section`);
            if (section.data.length > 0) {
                if (sectionEl) sectionEl.classList.remove('hidden');
                renderCarousel(`${section.id}Wrapper`, section.data);
                initSwiper(`#${section.id}Swiper`);
            } else {
                if (sectionEl) sectionEl.classList.add('hidden');
            }
        });

    } catch (error) {
        console.error("Erro ao buscar dados do Firestore: ", error);
        if (loadingIndicator) {
            loadingIndicator.innerHTML = '<p class="text-red-500">Não foi possível carregar as ofertas. Tente novamente mais tarde.</p>';
        }
    }
}

// =================================================================================
// 6. INICIALIZAÇÃO
// =================================================================================

// Executa a função principal quando a página carrega
window.onload = fetchDataAndRender;

