// Variável global para rastrear o ID do card que está sendo editado
let editingCardId = null;
// Variável global para armazenar a URL Base64 da imagem em edição/cadastro
let currentImageBase64 = "image/logofaci.png"; // Padrão

// Funções auxiliares (mantidas)
const base64ToArrayBuffer = (base64) => {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
};

const writeString = (view, offset, string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

const pcmToWav = (pcm16, sampleRate) => {
  // Cria um novo Blob com o cabeçalho WAV
  const buffer = new ArrayBuffer(44 + pcm16.length * 2);
  const view = new DataView(buffer);
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + pcm16.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, pcm16.length * 2, true);
  let offset = 44;
  for (let i = 0; i < pcm16.length; i++, offset += 2) {
    view.setInt16(offset, pcm16[i], true);
  }
  return new Blob([view], { type: "audio/wav" });
};

// --- FUNÇÕES DE LÓGICA DE EVENTOS ---

/**
 * Gera um novo ID de card único.
 */
function getNextCardId() {
  const existingCards = document.querySelectorAll(".eventos-card");
  let maxId = 0;
  existingCards.forEach((card) => {
    const match = card.id.match(/card(\d+)/);
    if (match) {
      const idNum = parseInt(match[1]);
      if (idNum > maxId) {
        maxId = idNum;
      }
    }
  });
  return `card${maxId + 1}`;
}

/**
 * Atualiza a visualização da imagem na Etapa 1.
 * @param {string} src A URL (pode ser Base64 ou caminho estático) da imagem.
 */
function updatePreview(src) {
  const previewImage = document.getElementById("previewImage");
  if (previewImage) {
    previewImage.src = src;
  }
}

/**
 * Função assíncrona para ler o arquivo como Base64.
 * @param {File} file O objeto File selecionado.
 * @returns {Promise<string>} Promessa que resolve com a string Base64.
 */
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

// Listener de mudança de arquivo para atualizar a preview e a variável global
async function handleFileChange(event) {
  const fileInput = event.target;
  const file = fileInput.files[0];

  if (file) {
    try {
      const base64String = await readFileAsBase64(file);
      currentImageBase64 = base64String;
      updatePreview(currentImageBase64);
    } catch (error) {
      console.error("Erro ao ler o arquivo:", error);
      currentImageBase64 = "image/logofaci.png";
      updatePreview(currentImageBase64);
    }
  } else if (editingCardId === null) {
    // Se for um novo cadastro e o usuário cancelou a seleção, usa o padrão.
    currentImageBase64 = "image/logofaci.png";
    updatePreview(currentImageBase64);
  }
  // Se estiver em edição, manterá a imagem anterior se não for selecionada uma nova.
}

/**
 * Cria ou atualiza um card de evento no DOM e fecha o painel de cadastro/edição.
 */
async function salvarEvento() {
  // 1. Coletar dados do formulário (Etapa 2)
  const titulo =
    document.getElementById("inputTitulo")?.value.trim() ||
    "Novo Evento Cadastrado";
  const imageUrl = currentImageBase64;
  const descricao =
    document.getElementById("inputDescricao")?.value ||
    "Descrição não informada."; // NOVO: Captura a descrição
  const rawData = document.getElementById("inputData")?.value;
  const rawHorario = document.getElementById("inputHorario")?.value;
  const local =
    document.getElementById("inputLocal")?.value || "Local não informado";
  const requisitos =
    document.getElementById("inputRequisitos")?.value ||
    "Requisitos não informados.";

  // (Conversão de data e horário mantida)
  let dataDisplay = "Data não informada";
  if (rawData) {
    const parts = rawData.split("-");
    if (parts.length === 3) {
      dataDisplay = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  let horarioDisplay = "Horário não informado";
  if (rawHorario) {
    horarioDisplay = `${rawHorario}h`;
  }

  if (!titulo || titulo === "Novo Evento Cadastrado") {
    console.error("Título do evento é obrigatório.");
    return;
  }

  let isEditing = editingCardId !== null;
  let cardId = isEditing ? editingCardId : getNextCardId();
  const cardIndex = cardId.replace("card", "");
  const confirmModalId = `modalConfirmacao-${cardIndex}`;

  if (isEditing) {
    document.getElementById(confirmModalId)?.remove();
  }

  // Define o resumo da descrição para o card (primeiros 100 caracteres)
  const resumoDescricao =
    descricao.substring(0, 100).trim() + (descricao.length > 100 ? "..." : "");

  // 3. Criar/Atualizar o HTML do card
  // Nota: Uso de replace para escapar aspas duplas na string do atributo data-
  const newCardHTML = `
                <div class="eventos-card" id="${cardId}">
                    <div class="icones-card">
                        <button class="info-botao-evento" title="Ver detalhes" 
                                data-event-title="${titulo}" 
                                data-event-data="${dataDisplay}" 
                                data-event-horario="${horarioDisplay}" 
                                data-event-local="${local}" 
                                data-event-requisitos="${requisitos}"
                                data-event-image="${imageUrl}"
                                data-event-descricao="${descricao.replace(
                                  /"/g,
                                  "&quot;"
                                )}">
                            🛈
                        </button>
                        <button class="delete-botao-evento" title="Excluir evento" data-modal-target="${confirmModalId}"><i class="fas fa-trash-alt"></i></button>
                    </div>

                    <img src="${imageUrl}" alt="${titulo}" class="evento-image">

                    <div class="caixa-texto-evento">
                        <h3 class="info-evento">${titulo}</h3>
                        <p class="paragra-evento">
                            ${resumoDescricao}
                        </p>
                        <button type="submit" class="botao-evento">Editar</button>
                    </div>

                    <div class="modal-overlay" id="${confirmModalId}" style="display: none;">
                        <div class="modal-content">
                            <button class="fechar-modal" aria-label="Fechar Modal">&times;</button>
                            <h3>Tem certeza que deseja excluir este evento: ${titulo}?</h3>
                            <div class="modal-actions">
                                <button class="botao-perigo" id="confirmarExclusao-${cardIndex}">Sim</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

  // 4. Adicionar/Substituir o card no container
  const eventosContainer = document.querySelector(".eventos");
  if (isEditing) {
    const oldCard = document.getElementById(cardId);
    if (oldCard) {
      oldCard.outerHTML = newCardHTML;
      console.log(`Evento ${cardId} atualizado com sucesso!`);
    }
  } else {
    eventosContainer.insertAdjacentHTML("beforeend", newCardHTML);
    console.log(`Novo evento ${cardId} cadastrado com sucesso!`);
  }

  // 5. Fechar o formulário e configurar listeners
  fecharCadastroEvento();
  setupNewCardListeners(cardId);
  setupEditButtonListeners();
}

/**
 * Abre o painel de edição, preenche o formulário e define o modo de edição.
 */
function abrirEdicaoEvento(button) {
  const cardElement = button.closest(".eventos-card");
  if (!cardElement) return;

  const infoButton = cardElement.querySelector(".info-botao-evento");
  if (!infoButton) return;

  editingCardId = cardElement.id;

  const title = infoButton.getAttribute("data-event-title") || "";
  const dataDisplay = infoButton.getAttribute("data-event-data") || "";
  const horarioDisplay = infoButton.getAttribute("data-event-horario") || "";
  const local = infoButton.getAttribute("data-event-local") || "";
  const requisitos = infoButton.getAttribute("data-event-requisitos") || "";
  const imageUrl =
    infoButton.getAttribute("data-event-image") || "image/logofaci.png";
  const descricao = infoButton.getAttribute("data-event-descricao") || ""; // NOVO: Captura a descrição

  // Define a imagem atual no estado global e na preview
  currentImageBase64 = imageUrl;
  updatePreview(imageUrl);

  // Reseta o campo de arquivo, já que não podemos preenchê-lo por segurança
  document.getElementById("inputImagemFile").value = "";

  // Conversão de data e hora para preenchimento de input
  let rawData = "";
  const dateParts = dataDisplay.split("/");
  if (dateParts.length === 3) {
    rawData = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
  }
  const rawHorario = horarioDisplay.split("h")[0].trim();

  // Preenche o formulário (Etapa 2)
  document.getElementById("inputTitulo").value = title;
  document.getElementById("inputDescricao").value = descricao; // NOVO: Preenche a descrição
  document.getElementById("inputData").value = rawData;
  document.getElementById("inputHorario").value = rawHorario;
  document.getElementById("inputLocal").value = local;
  document.getElementById("inputRequisitos").value = requisitos;

  // Abre o painel
  document.getElementById("etapa").style.display = "flex";
  mostrarEtapa("etapa2");

  // Atualiza o texto do botão de conclusão
  const concluirButton = document.querySelector("#etapa3 .botao-secundario");
  if (concluirButton) {
    concluirButton.textContent = "Salvar Alterações";
  }
}

/**
 * Abre o painel de cadastro de eventos no modo "novo".
 */
function abrirCadastroEvento() {
  // Reset Edit Mode
  editingCardId = null;
  currentImageBase64 = "image/logofaci.png"; // Reseta a imagem para o padrão
  updatePreview(currentImageBase64); // Atualiza a preview

  // Limpa o formulário e o input file
  document.getElementById("inputTitulo").value = "";
  document.getElementById("inputDescricao").value = ""; // NOVO: Limpa a descrição
  document.getElementById("inputImagemFile").value = "";
  document.getElementById("inputData").value = "";
  document.getElementById("inputHorario").value = "";
  document.getElementById("inputLocal").value = "";
  document.getElementById("inputRequisitos").value = "";

  // Atualiza o texto do botão de conclusão
  const concluirButton = document.querySelector("#etapa3 .botao-secundario");
  if (concluirButton) {
    concluirButton.textContent = "Concluir Cadastro";
  }

  document.getElementById("etapa").style.display = "flex";
  mostrarEtapa("etapa1");
}

/**
 * Fecha o painel de cadastro de eventos e reseta as variáveis de estado.
 */
function fecharCadastroEvento() {
  document.getElementById("etapa").style.display = "none";
  editingCardId = null;
  currentImageBase64 = "image/logofaci.png";

  // Limpa todos os campos
  document.getElementById("inputTitulo").value = "";
  document.getElementById("inputDescricao").value = ""; // NOVO: Limpa a descrição
  document.getElementById("inputImagemFile").value = "";
  document.getElementById("inputData").value = "";
  document.getElementById("inputHorario").value = "";
  document.getElementById("inputLocal").value = "";
  document.getElementById("inputRequisitos").value = "";

  // Oculta todas as etapas
  ["etapa1", "etapa2", "etapa3"].forEach((id) => {
    const etapa = document.getElementById(id);
    if (etapa) {
      etapa.style.display = "none";
    }
  });

  // Resetar o texto do botão de conclusão
  const concluirButton = document.querySelector("#etapa3 .botao-secundario");
  if (concluirButton) {
    concluirButton.textContent = "Concluir Cadastro";
  }
}

/**
 * Navega entre as etapas do formulário de cadastro.
 */
function mostrarEtapa(etapaId) {
  if (etapaId === "etapa0") {
    fecharCadastroEvento();
    return;
  }

  // Oculta todas as etapas
  ["etapa1", "etapa2", "etapa3"].forEach((id) => {
    const etapa = document.getElementById(id);
    if (etapa) {
      etapa.style.display = "none";
    }
  });

  // Mostra a etapa desejada
  const etapaDesejada = document.getElementById(etapaId);
  if (etapaDesejada) {
    etapaDesejada.style.display = "flex";
    document.getElementById("etapa").style.display = "flex";
  }
}

/**
 * Adiciona listeners de click a todos os botões 'Editar' nos cards.
 */
function setupEditButtonListeners() {
  document.querySelectorAll(".botao-evento").forEach((button) => {
    button.removeEventListener("click", handleEditClick);
    button.addEventListener("click", handleEditClick);
  });
}

/**
 * Handler para o click no botão 'Editar'.
 */
function handleEditClick(e) {
  e.preventDefault();
  abrirEdicaoEvento(e.currentTarget);
}

/**
 * Configura os event listeners para um card (novo ou atualizado).
 */
function setupNewCardListeners(newCardId) {
  const newCard = document.getElementById(newCardId);
  if (!newCard) return;

  // Re-setup dos Listeners de Informação e Exclusão (Lixeira)
  const infoButton = newCard.querySelector(".info-botao-evento");
  if (infoButton) {
    infoButton.addEventListener("click", () => {
      openDynamicModal(infoButton);
    });
  }

  const deleteButton = newCard.querySelector(".delete-botao-evento");
  const confirmModalId = deleteButton.getAttribute("data-modal-target");
  const confirmModal = document.getElementById(confirmModalId);

  if (deleteButton) {
    deleteButton.addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirmModal) confirmModal.style.display = "flex";
    });
  }

  // (Lógica de fechar modal de confirmação e excluir é mantida)
  if (confirmModal) {
    confirmModal
      .querySelector(".fechar-modal")
      ?.addEventListener("click", (e) => {
        e.target.closest(".modal-overlay").style.display = "none";
      });

    confirmModal.addEventListener("click", (e) => {
      if (e.target === confirmModal) {
        confirmModal.style.display = "none";
      }
    });

    const confirmDeleteButton = confirmModal.querySelector(
      '[id^="confirmarExclusao"]'
    );
    if (confirmDeleteButton) {
      confirmDeleteButton.addEventListener("click", () => {
        newCard.remove();
        confirmModal.style.display = "none";
        console.log(`Evento ${newCardId} excluído com sucesso!`);
      });
    }
  }
}

/**
 * Abre o modal de detalhes (Informação).
 */
function openDynamicModal(button) {
  const modal = document.getElementById("infoModal");
  const modalTitle = document.getElementById("modal-title");
  const modalBody = document.getElementById("modal-body");

  const title = button.getAttribute("data-event-title") || "Detalhes do Evento";
  const data = button.getAttribute("data-event-data") || "N/A";
  const horario = button.getAttribute("data-event-horario") || "N/A";
  const local = button.getAttribute("data-event-local") || "N/A";
  const requisitos =
    button.getAttribute("data-event-requisitos") || "Não especificados.";
  const descricao =
    button.getAttribute("data-event-descricao") ||
    "Detalhes adicionais não fornecidos."; // NOVO: Captura a descrição

  modalTitle.textContent = title;
  modalBody.innerHTML = `
                <p><strong>Data:</strong> ${data}</p>
                <p><strong>Horário:</strong> ${horario}</p>
                <p><strong>Local:</strong> ${local}</p>
                <p><strong>Requisitos:</strong> ${requisitos}</p>
                <p class="modal-full-description">${descricao}</p> <!-- NOVO: Exibe a descrição completa -->
            `;
  modal.style.display = "flex";
}

// --- INICIALIZAÇÃO E LISTENERS (DOMContentLoaded) ---

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("infoModal");
  const openButtons = document.querySelectorAll(".info-botao-evento");
  const closeButton = document.querySelector(".close-modal-btn");
  const inputFile = document.getElementById("inputImagemFile");

  // 1. Configura listener para a seleção de arquivo
  if (inputFile) {
    inputFile.addEventListener("change", handleFileChange);
  }

  // 2. Configura listener para o botão principal de cadastro
  const botaoCadastrar = document.getElementById("botaoCadastrar");
  if (botaoCadastrar) {
    botaoCadastrar.addEventListener("click", abrirCadastroEvento);
  }

  // 3. Configura listeners para os botões 'Editar' estáticos iniciais
  setupEditButtonListeners();

  // 4. Configura listeners para os cards estáticos
  openButtons.forEach((button) => {
    button.addEventListener("click", () => {
      openDynamicModal(button);
    });
  });

  // 5. Configurações gerais de modal (detalhes e confirmação)
  closeButton.addEventListener("click", () => {
    modal.style.display = "none";
  });
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  document.querySelectorAll(".delete-botao-evento").forEach((button) => {
    button.addEventListener("click", (e) => {
      const targetId = button.getAttribute("data-modal-target");
      const confirmModal = document.getElementById(targetId);
      if (confirmModal) {
        e.stopPropagation();
        confirmModal.style.display = "flex";
      }
    });
  });

  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.style.display = "none";
      }
    });
  });

  document.querySelectorAll(".fechar-modal").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.target.closest(".modal-overlay").style.display = "none";
    });
  });

  document.querySelectorAll('[id^="confirmarExclusao"]').forEach((button) => {
    button.addEventListener("click", (e) => {
      const cardIndex = button.id.split("-")[1];
      const cardElement = document.getElementById(`card${cardIndex}`);
      const modalOverlay = button.closest(".modal-overlay");

      if (cardElement) {
        cardElement.remove();
        console.log(`Evento ${cardIndex} excluído com sucesso!`);
      }
      if (modalOverlay) {
        modalOverlay.style.display = "none";
      }
    });
  });
});
