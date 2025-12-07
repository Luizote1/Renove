class GerenciadorCheckout {
    constructor() {
        this.carrinho = [];
        this.iniciar();
    }

    iniciar() {
        this.carregarCarrinho();
        this.configurarEventos();
        this.atualizarResumoPedido();
        this.configurarAlternanciaPagamento();
        this.configurarRestricaoData();
    }

    carregarCarrinho() {
        const carrinhoSalvo = localStorage.getItem('cart');
        if (carrinhoSalvo) {
            this.carrinho = JSON.parse(carrinhoSalvo);
        }
    }

    configurarEventos() {
        const formulario = document.getElementById('checkoutForm');
        if (formulario) {
            formulario.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processarCheckout();
            });
        }

        this.configurarMascaras();

        // Configuração Robusta do CEP
        const inputCep = document.getElementById('zipCode');
        if (inputCep) {
            // Evento blur (sair do campo) dispara a busca
            inputCep.addEventListener('blur', (e) => this.consultarCepAPI(e.target.value));

            // Evento input (digitar) limpa erros visuais imediatamente
            inputCep.addEventListener('input', (e) => {
                this.limparStatusVisual(e.target);
            });
        }

        const inputCelular = document.getElementById('phone');
        if (inputCelular) {
            inputCelular.addEventListener('blur', (e) => this.validarCelularLogica(e.target));
            inputCelular.addEventListener('input', (e) => this.limparStatusVisual(e.target));
        }

        const inputDataNasc = document.getElementById('firstDate');
        if (inputDataNasc) {
            inputDataNasc.addEventListener('blur', () => this.validarDataNascimento());
        }
    }

    // --- FUNÇÃO DE CEP CORRIGIDA (SEM BLOQUEIOS) ---

    async consultarCepAPI(cep) {
        const cepLimpo = cep.replace(/\D/g, '');
        const campoCep = document.getElementById('zipCode');

        // Se CEP inválido, para.
        if (cepLimpo.length !== 8) return;

        // 1. Mostra aviso visual, MAS NÃO TRAVA NADA
        this.alternarLoadingInput(campoCep, true);

        try {
            const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
            const dados = await resposta.json();

            // 2. Remove aviso visual imediatamente após a resposta
            this.alternarLoadingInput(campoCep, false);

            if (!dados.erro) {
                // SUCESSO: Preenche os campos
                // Usa função segura que não quebra se o ID não existir
                this.preencherCampoSeguro(['address', 'rua', 'logradouro'], dados.logradouro);
                this.preencherCampoSeguro(['neighborhood', 'bairro'], dados.bairro);
                this.preencherCampoSeguro(['city', 'cidade', 'localidade'], dados.localidade);
                this.preencherCampoSeguro(['state', 'uf', 'estado'], dados.uf);

                // Marca CEP como válido (verde)
                campoCep.classList.add("is-valid");
                campoCep.classList.remove("is-invalid");

                // Tenta focar no número
                const campoNumero = document.getElementById('number') || document.getElementById('numero');
                if (campoNumero) campoNumero.focus();

            } else {
                // ERRO LÓGICO (CEP não existe na base)
                this.mostrarErroInput(campoCep, 'CEP não encontrado.');
                // Não limpamos os campos para não apagar o que o usuário talvez já tenha digitado
            }
        } catch (erro) {
            // ERRO DE CONEXÃO
            this.alternarLoadingInput(campoCep, false);
            console.error("Erro CEP:", erro);
            // Não mostramos erro visual intrusivo, deixamos o usuário preencher manual
        }
    }

    // Função que tenta encontrar o campo por vários nomes (Português/Inglês)
    preencherCampoSeguro(listaIds, valor) {
        if (!valor) return;

        for (let id of listaIds) {
            let elemento = document.getElementById(id);
            if (elemento) {
                elemento.value = valor;
                // Garante que o campo esteja editável
                elemento.readOnly = false;
                elemento.disabled = false;
                // Dispara evento para atualizar labels flutuantes se houver
                elemento.dispatchEvent(new Event('input'));
                return;
            }
        }
    }

    // Função simplificada para gerenciar o "Carregando..."
    alternarLoadingInput(input, ativado) {
        // Procura se já existe um aviso de loading
        let loadingDiv = input.parentNode.querySelector('.input-loading-feedback');

        if (ativado) {
            // Se ativado e não existe div, cria
            if (!loadingDiv) {
                loadingDiv = document.createElement("div");
                loadingDiv.className = "input-loading-feedback text-primary small mt-1";
                loadingDiv.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Buscando endereço...';
                input.parentNode.insertBefore(loadingDiv, input.nextSibling);
            }
        } else {
            // Se desativado e existe div, remove
            if (loadingDiv) {
                loadingDiv.remove();
            }
        }
        // IMPORTANTE: Nunca alteramos readOnly ou disabled aqui.
    }

    limparStatusVisual(input) {
        input.classList.remove("is-valid");
        input.classList.remove("is-invalid");
        // Remove loading se o usuário começar a digitar de novo
        this.alternarLoadingInput(input, false);
    }

    // --- RESTANTE DAS VALIDAÇÕES E MÁSCARAS ---

    configurarRestricaoData() {
        const inputDataNasc = document.getElementById('firstDate');
        if (inputDataNasc) {
            const hoje = new Date();
            const corte = new Date(hoje.getFullYear() - 18, hoje.getMonth(), hoje.getDate());
            const ano = corte.getFullYear();
            const mes = String(corte.getMonth() + 1).padStart(2, "0");
            const dia = String(corte.getDate()).padStart(2, "0");
            inputDataNasc.max = `${ano}-${mes}-${dia}`;
        }
    }

    validarDataNascimento() {
        const inputData = document.getElementById('firstDate');
        if (!inputData || !inputData.value) return false;

        const dataNasc = new Date(inputData.value);
        const hoje = new Date();

        // Calcula idade
        let idade = hoje.getFullYear() - dataNasc.getFullYear();
        const mes = hoje.getMonth() - dataNasc.getMonth();

        if (mes < 0 || (mes === 0 && hoje.getDate() < dataNasc.getDate())) {
            idade--;
        }

        // Bloqueio: menor de idade
        if (idade < 18) {
            this.mostrarErroInput(inputData, 'Você deve ter pelo menos 18 anos.');
            return false;
        }

        // Bloqueio: pessoas muito velhas (ex.: mais de 120 anos)
        if (idade > 120) {
            this.mostrarErroInput(inputData, 'Data de nascimento inválida.');
            return false;
        }

        // Se está ok → remove erro
        this.limparErro(inputData);
        return true;
    }

    // --- substituir método configurarMascaras() ---
    configurarMascaras() {
        // aceita ambos ids: 'cpf' (preferido) ou 'firstCpf' (se já existir no HTML)
        const inputCpf = document.getElementById('cpf') || document.getElementById('firstCpf');
        if (inputCpf) {
            inputCpf.addEventListener('input', (e) => {
                this.limparStatusVisual(e.target);
                let apenasNums = e.target.value.replace(/\D/g, "");
                // limita a 11 dígitos numéricos
                apenasNums = apenasNums.slice(0, 11);
                // aplica máscara progressiva
                let valorMascarado = apenasNums;
                valorMascarado = valorMascarado.replace(/(\d{3})(\d)/, "$1.$2");
                valorMascarado = valorMascarado.replace(/(\d{3})(\d)/, "$1.$2");
                valorMascarado = valorMascarado.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                e.target.value = valorMascarado;

                // Se completou 11 dígitos numéricos -> validar CPF
                if (apenasNums.length === 11) {
                    if (!this.validarCPF(e.target.value)) {
                        this.mostrarErroInput(e.target, "CPF inválido.");
                    } else {
                        this.limparErro(e.target);
                    }
                } else {
                    // se não está completo, remove validação visual
                    e.target.classList.remove("is-valid", "is-invalid");
                }
            });

            // opcional: validar onblur também (caso cole/coleie)
            inputCpf.addEventListener('blur', (e) => {
                const apenasNums = e.target.value.replace(/\D/g, "");
                if (apenasNums.length === 11) {
                    if (!this.validarCPF(e.target.value)) {
                        this.mostrarErroInput(e.target, "CPF inválido.");
                    } else {
                        this.limparErro(e.target);
                    }
                }
            });
        }

        // restante das máscaras (telefone, cep, cartao...) - mantenha seu código atual
        const inputTelefone = document.getElementById('phone');
        if (inputTelefone) {
            inputTelefone.addEventListener('input', (e) => {
                let valor = e.target.value.replace(/\D/g, '');
                if (valor.length <= 11) {
                    valor = valor.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                    e.target.value = valor;
                }
            });
        }

        const inputCep = document.getElementById('zipCode');
        if (inputCep) {
            inputCep.addEventListener('input', (e) => {
                let valor = e.target.value.replace(/\D/g, '');
                if (valor.length <= 8) {
                    valor = valor.replace(/(\d{5})(\d{3})/, '$1-$2');
                    e.target.value = valor;
                }
            });
        }

        const inputCartao = document.getElementById('cardNumber');
        if (inputCartao) {
            inputCartao.addEventListener('input', (e) => {
                let valor = e.target.value.replace(/\D/g, '');
                if (valor.length <= 16) {
                    valor = valor.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
                    e.target.value = valor;
                }
            });
        }

        const inputValidade = document.getElementById('expiryDate');
        if (inputValidade) {
            inputValidade.addEventListener('input', (e) => {
                let valor = e.target.value.replace(/\D/g, '');
                if (valor.length <= 4) {
                    valor = valor.replace(/(\d{2})(\d{2})/, '$1/$2');
                    e.target.value = valor;
                }
            });
        }
    }

    // --- substituir método validarCPF(cpf) ---
    validarCPF(cpf) {
        // aceita string bruta ou elemento input
        let valor;
        if (typeof cpf === 'string') {
            valor = cpf;
        } else if (cpf && cpf.value !== undefined) {
            valor = cpf.value;
        } else {
            return false;
        }

        // limpa tudo não numérico
        const numeros = valor.replace(/[^\d]+/g, '');
        if (numeros === '' || numeros.length !== 11 || /^(\d)\1{10}$/.test(numeros)) return false;

        let add = 0;
        for (let i = 0; i < 9; i++) add += parseInt(numeros.charAt(i), 10) * (10 - i);
        let rev = 11 - (add % 11);
        if (rev === 10 || rev === 11) rev = 0;
        if (rev !== parseInt(numeros.charAt(9), 10)) return false;

        add = 0;
        for (let i = 0; i < 10; i++) add += parseInt(numeros.charAt(i), 10) * (11 - i);
        rev = 11 - (add % 11);
        if (rev === 10 || rev === 11) rev = 0;
        if (rev !== parseInt(numeros.charAt(10), 10)) return false;

        return true;
    }


    configurarAlternanciaPagamento() {
        const metodosPagamento = document.querySelectorAll('input[name="paymentMethod"]');
        const camposCartao = document.getElementById('creditCardFields');

        if (metodosPagamento.length > 0 && camposCartao) {
            metodosPagamento.forEach(metodo => {
                metodo.addEventListener('change', (e) => {
                    if (e.target.value === 'credit') {
                        camposCartao.style.display = 'block';
                    } else {
                        camposCartao.style.display = 'none';
                    }
                });
            });
        }
    }

    validarCelularLogica(input) {
        const celular = input.value.replace(/\D/g, '');
        if (celular.length === 0) return;

        if (celular.length !== 11 || parseInt(celular.substring(0, 2)) < 11 || celular.substring(2, 3) !== '9') {
            this.mostrarErroInput(input, 'Celular inválido (DDD + 9xxxx-xxxx).');
            return false;
        }

        this.limparErro(input);
        return true;
    }

    atualizarResumoPedido() {
        const resumoPedido = document.getElementById('orderSummary');
        const elementoSubtotal = document.getElementById('subtotal');
        if (!resumoPedido || !elementoSubtotal) return;

        if (this.carrinho.length === 0) {
            resumoPedido.innerHTML = '<p class="text-muted">Carrinho vazio</p>';
            return;
        }

        resumoPedido.innerHTML = this.carrinho.map(item => `
            <div class="d-flex align-items-center mb-3">
                <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: contain;" class="me-3">
                <div class="flex-grow-1">
                    <h6 class="mb-1">${item.name}</h6>
                    <p class="mb-1 text-muted">Qtd: ${item.quantity}</p>
                    <p class="mb-0 fw-bold">R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</p>
                </div>
            </div>
        `).join('');

        const subtotal = this.carrinho.reduce((soma, item) => soma + (item.price * item.quantity), 0);
        const frete = subtotal > 100 ? 0 : 15.90;
        const taxas = subtotal * 0.05;
        const total = subtotal + frete + taxas;

        elementoSubtotal.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
        const elFrete = document.getElementById('shipping');
        if (elFrete) elFrete.textContent = frete === 0 ? 'Grátis' : `R$ ${frete.toFixed(2).replace('.', ',')}`;

        const elTaxas = document.getElementById('taxes');
        if (elTaxas) elTaxas.textContent = `R$ ${taxas.toFixed(2).replace('.', ',')}`;

        const elTotal = document.getElementById('total');
        if (elTotal) elTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }

    validarFormulario() {
        this.limparTodasValidacoes();
        let valido = true;

        const camposObrigatorios = ['firstName', 'lastName', 'email', 'phone', 'cpf', 'firstDate', 'zipCode'];
        // Tenta achar campos de endereço pelo ID que estiver disponível
        const idsEndereco = ['address', 'rua', 'city', 'cidade', 'state', 'uf', 'number', 'numero'];

        [...camposObrigatorios, ...idsEndereco].forEach(id => {
            const campo = document.getElementById(id);
            if (campo && !campo.value.trim()) {
                this.mostrarErroInput(campo, `Campo obrigatório.`);
                valido = false;
            }
        });

        const campoEmail = document.getElementById('email');
        if (campoEmail && campoEmail.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campoEmail.value)) {
            this.mostrarErroInput(campoEmail, 'E-mail inválido.');
            valido = false;
        }

        const campoCpf = document.getElementById('cpf');
        if (campoCpf && campoCpf.value && !this.validarCPF(campoCpf.value)) {
            this.mostrarErroInput(campoCpf, 'CPF inválido.');
            valido = false;
        }

        const campoData = document.getElementById('firstDate');
        if (campoData && !this.validarDataNascimento()) {
            valido = false;
        }

        const metodoPagamento = document.querySelector('input[name="paymentMethod"]:checked');
        if (metodoPagamento && metodoPagamento.value === 'credit') {
            const camposCartao = ['cardNumber', 'expiryDate', 'cvv', 'cardName'];
            camposCartao.forEach(id => {
                const campo = document.getElementById(id);
                if (campo && !campo.value.trim()) {
                    this.mostrarErroInput(campo, `Campo obrigatório.`);
                    valido = false;
                }
            });
        }

        if (!valido) {
            const primeiroErro = document.querySelector('.is-invalid');
            if (primeiroErro) primeiroErro.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        return valido;
    }

    processarCheckout() {
        if (!this.validarFormulario()) return;

        const botaoSubmit = document.querySelector('button[type="submit"]');
        const textoOriginal = botaoSubmit.innerHTML;
        botaoSubmit.disabled = true;
        botaoSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processando...';

        setTimeout(() => {
            this.finalizarCompra();
            botaoSubmit.disabled = false;
            botaoSubmit.innerHTML = textoOriginal;
        }, 2000);
    }

    finalizarCompra() {
        localStorage.removeItem('cart');
        this.mostrarAlertaSucesso('Compra realizada com sucesso!');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
    }

    mostrarErroInput(input, mensagem) {
        input.classList.remove("is-valid");
        input.classList.add("is-invalid");
        let feedback = input.nextElementSibling;
        if (!feedback || !feedback.classList.contains("invalid-feedback")) {
            feedback = document.createElement("div");
            feedback.className = "invalid-feedback";
            input.parentNode.insertBefore(feedback, input.nextSibling);
        }
        feedback.textContent = mensagem;
    }

    limparErro(input) {
        input.classList.remove("is-invalid");
        input.classList.add("is-valid");
    }

    limparTodasValidacoes() {
        document.querySelectorAll(".form-control, .form-select").forEach(input => {
            input.classList.remove("is-invalid");
            input.classList.remove("is-valid");
        });
    }

    mostrarAlertaSucesso(mensagem) {
        const alerta = document.createElement('div');
        alerta.className = `alert alert-success fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
        alerta.style.zIndex = '9999';
        alerta.innerHTML = `${mensagem} <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
        document.body.appendChild(alerta);
        setTimeout(() => alerta.remove(), 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GerenciadorCheckout();
});