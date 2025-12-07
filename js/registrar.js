document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.querySelector("form");
    const inputNome = document.getElementById("nome");
    const inputEmail = document.getElementById("email");
    const inputSenha = document.getElementById("senha");
    const inputConfirmarSenha = document.getElementById("confirmar_senha");

    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();
        limparValidacao();

        let cadastroValido = true;

        const regexNome = /^[a-zA-Z\u00C0-\u00FF ]+$/;
        if (inputNome.value.trim().length < 2 || !regexNome.test(inputNome.value.trim())) {
            mostrarErro(inputNome, "O nome deve conter apenas letras e ter no mínimo 2 caracteres.");
            cadastroValido = false;
        }

        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regexEmail.test(inputEmail.value.trim())) {
            mostrarErro(inputEmail, "Por favor, insira um e-mail válido.");
            cadastroValido = false;
        }

        const valorSenha = inputSenha.value;
        const possuiNumero = /\d/.test(valorSenha);
        const possuiEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(valorSenha);

        if (valorSenha.length < 6 || !possuiNumero || !possuiEspecial) {
            mostrarErro(inputSenha, "A senha deve ter no mínimo 6 caracteres, um número e um caractere especial (ex: @, $).");
            cadastroValido = false;
        }

        if (valorSenha !== inputConfirmarSenha.value) {
            mostrarErro(inputConfirmarSenha, "As senhas não coincidem.");
            cadastroValido = false;
        }

        if (cadastroValido) {
            alert("Cadastro realizado com sucesso!");
            formulario.reset();
            limparValidacao();
        }
    });

    function mostrarErro(campo, mensagem) {
        campo.classList.add("is-invalid");
        
        let divErro = campo.nextElementSibling;
        
        if (!divErro || !divErro.classList.contains("invalid-feedback")) {
            divErro = document.createElement("div");
            divErro.className = "invalid-feedback";
            campo.parentNode.insertBefore(divErro, campo.nextSibling);
        }
        
        divErro.textContent = mensagem;
    }

    function limparValidacao() {
        const campos = formulario.querySelectorAll(".form-control");
        campos.forEach(campo => {
            campo.classList.remove("is-invalid");
        });
    }
});