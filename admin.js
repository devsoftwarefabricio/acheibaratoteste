// =================================================================================
// 1. CONFIGURAÇÃO DO FIREBASE
// =================================================================================

// ATENÇÃO: Cole aqui as mesmas configurações do Firebase do arquivo script.js
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
const storage = firebase.storage(); // Inicializa o Storage
const productsCollection = db.collection("products");

// =================================================================================
// 2. SELEÇÃO DE ELEMENTOS DO DOM
// =================================================================================

const addProductBtn = document.getElementById('add-product-btn');
const productList = document.getElementById('product-list');

// Formulário de Produto
const productForm = document.getElementById('product-form');
const formTitle = document.getElementById('form-title');
const cancelBtn = document.getElementById('cancel-btn');
const productIdField = document.getElementById('product-id');
const productName = document.getElementById('product-name');
const productCompany = document.getElementById('product-company');
const productCategory = document.getElementById('product-category');
const productPrice = document.getElementById('product-price');
const productRating = document.getElementById('product-rating');
const productReviews = document.getElementById('product-reviews');
const productDescription = document.getElementById('product-description');
const productImageUpload = document.getElementById('product-image-upload');
const imagePreview = document.getElementById('image-preview');
const productImageUrl = document.getElementById('product-image-url');
const uploadStatus = document.getElementById('upload-status');
const productFeatured = document.getElementById('product-featured');
const contactWhatsapp = document.getElementById('contact-whatsapp');
const contactFacebook = document.getElementById('contact-facebook');
const contactInstagram = document.getElementById('contact-instagram');
const contactWebsite = document.getElementById('contact-website');

// =================================================================================
// 3. LÓGICA DO PAINEL (CRUD - Create, Read, Update, Delete)
// =================================================================================

// Carrega todos os produtos
function loadProducts() {
    productsCollection.onSnapshot(snapshot => {
        let html = `
            <table class="w-full text-sm text-left text-gray-500">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th scope="col" class="px-6 py-3">Produto</th>
                        <th scope="col" class="px-6 py-3">Categoria</th>
                        <th scope="col" class="px-6 py-3">Preço</th>
                        <th scope="col" class="px-6 py-3">Ações</th>
                    </tr>
                </thead>
                <tbody>
        `;
        if (snapshot.empty) {
            html += `<tr><td colspan="4" class="text-center p-6">Nenhum produto cadastrado. Clique em 'Adicionar' para começar.</td></tr>`;
        } else {
            snapshot.forEach(doc => {
                const product = doc.data();
                html += `
                    <tr class="bg-white border-b hover:bg-gray-50">
                        <td class="px-6 py-4 font-medium text-gray-900 flex items-center">
                            <img src="${product.image || 'https://placehold.co/40x40'}" class="w-8 h-8 rounded-full mr-3 object-cover">
                            ${product.name}
                        </td>
                        <td class="px-6 py-4">${product.category}</td>
                        <td class="px-6 py-4">${product.price}</td>
                        <td class="px-6 py-4 flex gap-4">
                            <button onclick="editProduct('${doc.id}')" class="font-medium text-blue-600 hover:underline">Editar</button>
                            <button onclick="deleteProduct('${doc.id}')" class="font-medium text-red-600 hover:underline">Excluir</button>
                        </td>
                    </tr>
                `;
            });
        }
        html += `</tbody></table>`;
        productList.innerHTML = html;
    });
}

// Mostra/esconde o formulário
addProductBtn.addEventListener('click', () => {
    resetForm();
    formTitle.textContent = "Adicionar Novo Item";
    productForm.classList.remove('hidden');
});

cancelBtn.addEventListener('click', () => {
    productForm.classList.add('hidden');
    resetForm();
});

// Mostra preview da imagem selecionada
productImageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            imagePreview.src = event.target.result;
            imagePreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
});


// Reseta o formulário
function resetForm() {
    productForm.reset();
    productIdField.value = '';
    productImageUrl.value = '';
    imagePreview.src = '';
    imagePreview.classList.add('hidden');
    uploadStatus.textContent = '';
    productForm.querySelector('button[type="submit"]').disabled = false;
}

// Salva (cria ou atualiza) um produto
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = productIdField.value;
    const submitButton = productForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    uploadStatus.textContent = 'Salvando...';

    let imageUrl = productImageUrl.value; // Pega a URL da imagem existente, se houver
    const file = productImageUpload.files[0];

    try {
        // Se um novo arquivo foi selecionado, faz o upload
        if (file) {
            uploadStatus.textContent = 'Enviando imagem...';
            const fileName = `${Date.now()}-${file.name}`;
            const fileRef = storage.ref(`products/${fileName}`);
            await fileRef.put(file);
            imageUrl = await fileRef.getDownloadURL();
            uploadStatus.textContent = 'Imagem enviada!';
        }

        if (!imageUrl) {
            throw new Error("A imagem é obrigatória.");
        }

        const productData = {
            name: productName.value,
            company: productCompany.value,
            category: productCategory.value,
            price: productPrice.value,
            description: productDescription.value,
            image: imageUrl, // Usa a nova URL ou a antiga
            type: document.querySelector('input[name="type"]:checked').value,
            featured: productFeatured.checked,
            rating: parseFloat(productRating.value) || 0,
            reviews: parseInt(productReviews.value) || 0,
            contact: {
                whatsapp: contactWhatsapp.value,
                facebook: contactFacebook.value,
                instagram: contactInstagram.value,
                website: contactWebsite.value
            }
        };

        if (id) {
            await productsCollection.doc(id).update(productData);
        } else {
            await productsCollection.add(productData);
        }

        productForm.classList.add('hidden');
        resetForm();

    } catch (error) {
        console.error("Erro ao salvar produto: ", error);
        alert(`Ocorreu um erro ao salvar: ${error.message}`);
        uploadStatus.textContent = 'Erro ao salvar.';
        submitButton.disabled = false;
    }
});

// Preenche o formulário para edição
window.editProduct = async function(id) {
    try {
        const doc = await productsCollection.doc(id).get();
        if (!doc.exists) return;
        const product = doc.data();

        resetForm();
        productIdField.value = id;
        productName.value = product.name;
        productCompany.value = product.company;
        productCategory.value = product.category;
        productPrice.value = product.price;
        productDescription.value = product.description;
        
        if(product.image) {
            productImageUrl.value = product.image; // Armazena URL atual
            imagePreview.src = product.image;
            imagePreview.classList.remove('hidden');
        }

        document.querySelector(`input[name="type"][value="${product.type}"]`).checked = true;
        productFeatured.checked = product.featured;
        productRating.value = product.rating;
        productReviews.value = product.reviews;
        contactWhatsapp.value = product.contact?.whatsapp || '';
        contactFacebook.value = product.contact?.facebook || '';
        contactInstagram.value = product.contact?.instagram || '';
        contactWebsite.value = product.contact?.website || '';

        formTitle.textContent = "Editar Item";
        productForm.classList.remove('hidden');
    } catch (error) {
        console.error("Erro ao carregar produto para edição: ", error);
    }
}

// Deleta um produto
window.deleteProduct = async function(id) {
    if (confirm("Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.")) {
        try {
            // Opcional: deletar a imagem do Storage também (mais complexo)
            await productsCollection.doc(id).delete();
        } catch (error) {
            console.error("Erro ao excluir produto: ", error);
            alert("Ocorreu um erro ao excluir. Tente novamente.");
        }
    }
}

// =================================================================================
// 4. INICIALIZAÇÃO
// =================================================================================
loadProducts();

