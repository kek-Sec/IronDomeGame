// ts/ui/rocketInfoScreen.ts
import { rocketInfo } from '../config';
import { modalContainer, modalContent } from './domElements';
import { showModal } from './modal';

export function showRocketInfoScreen(closeCallback: () => void): void {
    showModal();
    let rocketHTML = '<div class="rocket-info-grid">';

    for (const key in rocketInfo) {
        const rocket = rocketInfo[key as keyof typeof rocketInfo];
        rocketHTML += `
            <div class="rocket-info-card">
                <h3>
                    <span>${rocket.name}</span>
                    <span class="threat-level threat-${rocket.threat.toLowerCase()}">${rocket.threat} Threat</span>
                </h3>
                <p>${rocket.description}</p>
            </div>
        `;
    }
    rocketHTML += '</div>';

    modalContent.innerHTML = `
        <h1>ROCKET BESTIARY</h1>
        ${rocketHTML}
        <button id="close-info-button" class="modal-button">CLOSE</button>
    `;

    const cleanupAndClose = (): void => {
        modalContainer.removeEventListener('click', backgroundClickHandler);
        closeCallback();
    };

    const backgroundClickHandler = (e: MouseEvent): void => {
        if (e.target === modalContainer) {
            cleanupAndClose();
        }
    };

    document.getElementById('close-info-button')?.addEventListener('click', cleanupAndClose);
    modalContainer.addEventListener('click', backgroundClickHandler);
}