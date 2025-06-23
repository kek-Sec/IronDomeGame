// ts/ui/modal.ts
import { modalContainer, modalContent } from './domElements';

export function hideModal(): void {
    modalContainer.style.display = 'none';
}

export function showModal(className: string = ''): void {
    modalContainer.style.display = 'flex';
    modalContent.className = 'modal-content'; // Reset classes
    if (className) {
        modalContent.classList.add(className);
    }
}

export function showLoadingScreen(): void {
    showModal();
    modalContent.innerHTML = '<h1>Loading Assets...</h1>';
}

export function showErrorScreen(message: string): void {
    showModal('game-over');
    modalContent.innerHTML = `<h1>Error</h1><p>${message}</p>`;
}