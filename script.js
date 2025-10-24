document.addEventListener('DOMContentLoaded', () => {
            const modal = document.getElementById('infoModal');
            // MUDANÇA: Selecionando a nova classe do botão
            const openButtons = document.querySelectorAll('.info-botao-evento'); 
            const closeButton = document.querySelector('.close-modal-btn');
            const modalTitle = document.getElementById('modal-title');
            const modalBody = document.getElementById('modal-body');
            
            // Dados de EXEMPLO para o modal
            const eventData = {
                'card1': {
                    title: 'Oficina de Programação Web',
                    details: `
                        <p><strong>Data:</strong> 15/11/2025</p>
                        <p><strong>Horário:</strong> 14:00h - 17:00h</p>
                        <p><strong>Local:</strong> Laboratório B (Sala 105)</p>
                        <p><strong>Requisitos:</strong> Notebook próprio e noções básicas de informática.</p>
                        <p class="modal-full-description">Esta oficina focará nos fundamentos de desenvolvimento front-end, 
                        perfeita para iniciantes. Serão 3 horas de atividades práticas. O evento vale 
                        <strong>20 Moedas FACI</strong> na conclusão e é limitado a 30 vagas.</p>
                    `
                },
                'card2': {
                    title: 'Torneio de E-Sports FACI',
                    details: `
                        <p><strong>Data:</strong> 25/11/2025</p>
                        <p><strong>Horário:</strong> 19:00h - 22:00h (Fase Eliminatória)</p>
                        <p><strong>Local:</strong> Auditório Principal</p>
                        <p><strong>Requisitos:</strong> Time de 5 pessoas inscrito e taxa de 5 Moedas FACI por time.</p>
                        <p class="modal-full-description">O torneio anual de jogos eletrônicos. O prêmio principal é de 
                        <strong>100 Moedas FACI</strong> para o time vencedor, além do troféu. As regras detalhadas serão 
                        enviadas por e-mail após a inscrição do time.</p>
                    `
                }
            };

            // Função para abrir o modal
            function openModal(cardId) {
                const data = eventData[cardId];
                if (data) {
                    modalTitle.textContent = data.title;
                    modalBody.innerHTML = data.details;
                } else {
                     modalTitle.textContent = 'Detalhes Não Encontrados';
                     modalBody.innerHTML = '<p>Não foi possível carregar as informações detalhadas deste evento. Tente novamente mais tarde.</p>';
                }
                
                modal.style.display = 'flex'; // Mostra o modal
            }

            // Função para fechar o modal
            function closeModal() {
                modal.style.display = 'none';
            }

            // 1. Adiciona listeners para o botão de informação (🛈)
            openButtons.forEach(button => {
                button.addEventListener('click', (event) => {
                    // Pega o ID (card1 ou card2) do elemento pai mais próximo com a classe 'eventos-card'
                    const cardElement = event.target.closest('.eventos-card');
                    if (cardElement) {
                        openModal(cardElement.id);
                    }
                });
            });

            // 2. Adiciona listener para o botão de fechar (X)
            closeButton.addEventListener('click', closeModal);

            // 3. Adiciona listener para fechar o modal clicando fora dele (no overlay)
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    closeModal();
                }
            });
        });