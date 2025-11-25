document.addEventListener("DOMContentLoaded", function () {
  // === 1. DECLARAÇÃO DE CONSTANTES GLOBAIS ===
  const containerEventos = document.querySelector(".eventos");
  const formNovoEvento = document.querySelector("#form-evento-admin");
  const eventoCardModal = document.getElementById("eventoCard");
  const abrirCardBtn = document.getElementById("abrirCard");
  const fecharBtn = document.getElementById("fecharBtn");
  const inputImagem = document.getElementById("imagem");
  const previewImagem = document.getElementById("previewImagemAtual");
  const salvarEventoBtn = document.getElementById("salvarEventoBtn");
  const inputCardIdEmEdicao = document.getElementById("cardIdEmEdicao");
  // NOVO: Constante para o campo Link da Inscrição
  const inputLinkInscricao = document.getElementById("link-inscricao");

  const IMAGEM_PADRAO_SRC = "image/logofaci.png";
  let finalImageSrc = IMAGEM_PADRAO_SRC;

  // === 2. FUNÇÃO: Limpa o formulário e prepara para um novo cadastro ===
  function limparFormularioParaCadastro() {
    formNovoEvento.reset();
    inputCardIdEmEdicao.value = ""; // Limpa o ID de edição
    salvarEventoBtn.value = "Cadastrar";

    if (previewImagem) {
      previewImagem.src = IMAGEM_PADRAO_SRC;
      previewImagem.style.display = "none";
    }
    finalImageSrc = IMAGEM_PADRAO_SRC;
    // NOVO: Limpa o campo do link de inscrição
    inputLinkInscricao.value = "";
  }

  // Listeners de Abertura/Fechamento de Modal (Formulário do Admin)
  if (abrirCardBtn && eventoCardModal) {
    abrirCardBtn.addEventListener("click", function () {
      limparFormularioParaCadastro();
      eventoCardModal.style.display = "flex";
    });
  }

  if (fecharBtn && eventoCardModal) {
    fecharBtn.addEventListener("click", function () {
      eventoCardModal.style.display = "none";
    });
  }

  // Fecha o modal do admin ao clicar fora
  if (eventoCardModal) {
    eventoCardModal.addEventListener("click", function (event) {
      if (event.target === eventoCardModal) {
        eventoCardModal.style.display = "none";
      }
    });
  }

  // === 3. FUNÇÃO: Preview da imagem do evento no formulário ===
  if (inputImagem && previewImagem) {
    inputImagem.addEventListener("change", function () {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          previewImagem.src = e.target.result;
          previewImagem.style.display = "block";
          finalImageSrc = e.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        // Lógica para manter a imagem em caso de edição, se o input de arquivo for cancelado/limpo
        const cardEmEdicao = inputCardIdEmEdicao.value
          ? document.getElementById(inputCardIdEmEdicao.value)
          : null;
        const srcAtual = cardEmEdicao
          ? cardEmEdicao.querySelector('[data-info="imagem-editar"]').src
          : IMAGEM_PADRAO_SRC;

        previewImagem.src = srcAtual;
        previewImagem.style.display =
          srcAtual && srcAtual !== IMAGEM_PADRAO_SRC ? "block" : "none";
        finalImageSrc = srcAtual;
      }
    });
  }

  // === 4. FUNÇÕES DE CONTROLE DE MODAIS DE CONFIRMAÇÃO (Exclusão) ===
  function aplicarListenersDeModalConfirmacao() {
    // Reaplica listeners para todos os botões que abrem modais de confirmação
    document.querySelectorAll("[data-modal-target]").forEach((botao) => {
      botao.removeEventListener("click", openModal);
      botao.addEventListener("click", openModal);
    });

    // Reaplica listeners para fechar modais no X
    document.querySelectorAll(".fechar-modal").forEach((botao) => {
      botao.removeEventListener("click", closeModal);
      botao.addEventListener("click", closeModal);
    });

    // Reaplica listeners para o botão 'Sim' de exclusão
    document.querySelectorAll(".botao-lixeira").forEach((botao) => {
      botao.removeEventListener("click", excluirCard);
      botao.addEventListener("click", excluirCard);
    });
  }

  function openModal(e) {
    e.preventDefault();
    const targetId = e.currentTarget.getAttribute("data-modal-target");
    const modal = document.getElementById(targetId);
    if (modal) {
      modal.style.display = "flex";
    }
  }

  function closeModal(e) {
    e.preventDefault();
    const modal = e.currentTarget.closest(".modal-overlay");
    if (modal) {
      modal.style.display = "none";
    }
  }

  // Remove o card da DOM ao confirmar a exclusão
  function excluirCard(e) {
    e.preventDefault();
    const cardId = e.currentTarget.getAttribute("data-card-id");
    const cardParaRemover = document.getElementById(cardId);
    const modal = e.currentTarget.closest(".modal-overlay");

    if (cardParaRemover) {
      cardParaRemover.remove();
    }
    if (modal) {
      modal.style.display = "none";
    }
  }

  aplicarListenersDeModalConfirmacao();

  // === 5. FUNÇÃO: Popula o formulário do admin com dados do card (Edição) ===
  if (containerEventos) {
    containerEventos.addEventListener("click", function (event) {
      const botaoEditar = event.target.closest(".botao-evento");
      if (botaoEditar) {
        event.preventDefault();

        const card = botaoEditar.closest(".eventos-card");
        if (!card) return;

        formNovoEvento.reset();
        inputCardIdEmEdicao.value = card.id; // Define o ID para modo de edição
        salvarEventoBtn.value = "Salvar Edição";

        // Extração dos dados do card
        const titulo = card
          .querySelector('[data-info="evento-titulo-editar"]')
          .textContent.trim();
        const dataCompleta = card
          .querySelector('[data-info="data-editar"]')
          .textContent.trim();
        const horarioCompleto = card
          .querySelector('[data-info="horario-intervalo-editar"]')
          .textContent.trim();
        const local = card
          .querySelector('[data-info="local-editar"]')
          .textContent.trim();
        const valorTexto = card
          .querySelector('[data-info="valor-editar"]')
          .textContent.trim();
        const requisitos = card
          .querySelector('[data-info="requisitos-editar"]')
          .textContent.trim();
        const descricao = card
          .querySelector('[data-info="descricao-completa-editar"]')
          .textContent.trim();
        // NOVO: Extrai o link de inscrição (do campo oculto)
        const linkInscricao = card
          .querySelector('[data-info="link-inscricao-editar"]')
          .textContent.trim();

        // Conversão de data para o formato aceito pelo input type="date"
        const [dia, mes, ano] = dataCompleta.split("/").map((v) => v.trim());
        const dataInputFormat = `${ano}-${mes}-${dia}`;

        // Extração dos horários
        const matchHorarios = horarioCompleto.match(
          /(\d{2}:\d{2})h\s*-\s*(\d{2}:\d{2})h/
        );
        const horarioInicio = matchHorarios ? matchHorarios[1] : "";
        const horarioFim = matchHorarios ? matchHorarios[2] : "";
        const valor = valorTexto.replace(/\s*Wyden Coins/i, "").trim();

        // Preenchimento do formulário
        document.getElementById("titulo").value = titulo;
        document.getElementById("data-evento").value = dataInputFormat;
        document.getElementById("horario-inicio").value = horarioInicio;
        document.getElementById("horario-fim").value = horarioFim;
        document.getElementById("local").value = local;
        document.getElementById("valor").value = valor;
        document.getElementById("requisitos").value = requisitos;
        document.getElementById("descricao").value = descricao;
        // NOVO: Preenche o link de inscrição
        inputLinkInscricao.value = linkInscricao;

        // Configura o preview da imagem atual
        const imagemElement = card.querySelector('[data-info="imagem-editar"]');
        const caminhoImagemAtual = imagemElement
          ? imagemElement.getAttribute("src")
          : IMAGEM_PADRAO_SRC;
        if (caminhoImagemAtual) {
          previewImagem.src = caminhoImagemAtual;
          previewImagem.style.display =
            caminhoImagemAtual && caminhoImagemAtual !== IMAGEM_PADRAO_SRC
              ? "block"
              : "none";
          finalImageSrc = caminhoImagemAtual;
        }

        eventoCardModal.style.display = "flex";
      }
    });
  }

  // === 6. FUNÇÃO: Lógica de CRIAÇÃO e EDIÇÃO visual ao submeter o formulário ===
  if (formNovoEvento && containerEventos) {
    formNovoEvento.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (!formNovoEvento.reportValidity()) {
        return;
      }

      const isEditing = inputCardIdEmEdicao.value !== "";
      const editingId = inputCardIdEmEdicao.value;
      let finalImageSrcForCard = finalImageSrc;

      // Coleta todos os dados do formulário
      const titulo = document.getElementById("titulo").value;
      const dataEvento = document.getElementById("data-evento").value;
      const horarioInicio = document.getElementById("horario-inicio").value;
      const horarioFim = document.getElementById("horario-fim").value;
      const local = document.getElementById("local").value;
      const valor = document.getElementById("valor").value;
      const requisitos = document.getElementById("requisitos").value;
      const descricao = document.getElementById("descricao").value;
      // NOVO: Coleta o link de inscrição
      const linkInscricao = inputLinkInscricao.value;

      // Formatação para exibição no card
      const dataObj = new Date(dataEvento + "T00:00:00");
      const dataFormatada = dataObj.toLocaleDateString("pt-BR", {
        timeZone: "UTC",
      });
      const horarioFormatado = `${horarioInicio}h - ${horarioFim}h`;

      // --- Lógica de EDIÇÃO VISUAL ---
      if (isEditing) {
        const cardParaEditar = document.getElementById(editingId);
        if (cardParaEditar) {
          // Atualiza todos os campos no card existente
          cardParaEditar.querySelector(
            '[data-info="evento-titulo-editar"]'
          ).textContent = titulo;
          cardParaEditar.querySelector(
            '[data-info="data-editar"]'
          ).textContent = dataFormatada;
          cardParaEditar.querySelector(
            '[data-info="horario-intervalo-editar"]'
          ).textContent = horarioFormatado;
          cardParaEditar.querySelector(
            '[data-info="local-editar"]'
          ).textContent = local;
          cardParaEditar.querySelector(
            '[data-info="valor-editar"]'
          ).textContent = `${valor} Wyden Coins`;
          cardParaEditar.querySelector(
            '[data-info="requisitos-editar"]'
          ).textContent = requisitos;
          cardParaEditar.querySelector(
            '[data-info="descricao-completa-editar"]'
          ).textContent = descricao;
          cardParaEditar.querySelector('[data-info="imagem-editar"]').src =
            finalImageSrcForCard;
          // NOVO: Atualiza o link de inscrição no campo oculto
          cardParaEditar.querySelector(
            '[data-info="link-inscricao-editar"]'
          ).textContent = linkInscricao;

          salvarEventoBtn.value = "Salvar Edição";
        }
      }
      // --- Lógica de CRIAÇÃO VISUAL ---
      else {
        const idNumerico = Date.now();
        const novoID = `eventos-card-${idNumerico}`;
        const novoModalID = `modalConfirmacao-${idNumerico}`;

        // Template HTML para o novo Card
        const novoCardHTML = `
                        <div class="eventos-card" id="${novoID}">
                            <div class="icones-card">
                                <button class="delete-botao-evento" title="Excluir evento" data-modal-target="${novoModalID}">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                            <img src="${finalImageSrcForCard}" alt="Evento ${titulo}" class="evento-image" data-info="imagem-editar">
                            <div class="caixa-texto-evento">
                                <div class="evento-card">
                                    <h1 class="evento-titulo" data-info="evento-titulo-editar">${titulo}</h1>
                                    <dl class="detalhes-lista">
                                        <dt>Data:</dt><dd data-info="data-editar">${dataFormatada}</dd>
                                        <dt>Horário:</dt><dd data-info="horario-intervalo-editar">${horarioFormatado}</dd>
                                        <dt>Local:</dt><dd data-info="local-editar">${local}</dd>
                                        <dt>Valor:</dt><dd data-info="valor-editar">${valor} Wyden Coins</dd>
                                        <dt>Requisitos:</dt><dd data-info="requisitos-editar">${requisitos}</dd>

                                        <dt style="display: none;">Link:</dt><dd data-info="link-inscricao-editar" style="display: none;">${linkInscricao}</dd>
                                    </dl>
                                    <div class="descricao-completa">
                                        <p data-info="descricao-completa-editar">${descricao}</p>
                                    </div>
                                    <button type="button" class="botao-evento">Editar</button>
                                </div>
                            </div>
                        </div>
                        
                                            <div class="modal-overlay" id="${novoModalID}" style="display: none;">
                            <div class="modal-content">
                                <button class="fechar-modal" aria-label="Fechar Modal">&times;</button>
                                <h3>Tem certeza que deseja excluir este evento?</h3>
                                <div class="modal-actions">
                                    <button class="botao-lixeira" data-card-id="${novoID}">Sim</button>
                                </div>
                            </div>
                        </div>
                    `;

        containerEventos.insertAdjacentHTML("beforeend", novoCardHTML);
      }

      // Finalização da operação (limpeza e fechamento)
      formNovoEvento.reset();
      eventoCardModal.style.display = "none";
      aplicarListenersDeModalConfirmacao();
      limparFormularioParaCadastro();
    });
  }
}); // Fim do DOMContentLoaded
