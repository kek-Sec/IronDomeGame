// ts/ui/pauseScreen.ts
import { modalContent } from './domElements';
import { showModal } from './modal';

export function showPauseScreen(resumeCallback: () => void, restartCallback: () => void): void {
    showModal();
    modalContent.innerHTML = `
        <h1>PAUSED</h1>
        <div class="upgrade-options">
            <button id="resume-button" class="modal-button">RESUME</button>
            <button id="restart-button-pause" class="modal-button">RESTART</button>
        </div>
    `;
    document.getElementById('resume-button')?.addEventListener('click', resumeCallback);
    document.getElementById('restart-button-pause')?.addEventListener('click', restartCallback);
}