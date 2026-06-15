import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClickInput from './ClickInput';

function renderInput(props: Partial<React.ComponentProps<typeof ClickInput>> = {}) {
    const setter = props.setter ?? vi.fn();
    render(
        <ClickInput
            currentStr={props.currentStr ?? 'Segment'}
            setter={setter}
            Tag={props.Tag ?? 'h2'}
            className={props.className ?? 'segmentTitle'}
            isDesactivated={props.isDesactivated ?? false}
        />
    );
    return { setter };
}

describe('ClickInput', () => {
    it('affiche la valeur courante', () => {
        renderInput({ currentStr: 'Mon segment' });
        expect(screen.getByText('Mon segment')).toBeInTheDocument();
    });

    it('passe en mode édition au clic', async () => {
        const user = userEvent.setup();
        renderInput();
        await user.click(screen.getByRole('button'));
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('enregistre un nom contenant un espace', async () => {
        const user = userEvent.setup();
        const { setter } = renderInput({ currentStr: 'Segment' });

        await user.click(screen.getByRole('button'));
        const input = screen.getByRole('textbox');
        await user.clear(input);
        await user.type(input, 'Aire de repos{Enter}');

        expect(setter).toHaveBeenCalledWith('Aire de repos');
    });

    it('ignore une saisie composée uniquement d\'espaces', async () => {
        const user = userEvent.setup();
        const { setter } = renderInput({ currentStr: 'Segment' });

        await user.click(screen.getByRole('button'));
        const input = screen.getByRole('textbox');
        await user.clear(input);
        await user.type(input, '   {Enter}');

        expect(setter).not.toHaveBeenCalled();
    });

    it('stoppe la propagation clavier vers un parent draggable (fix dnd-kit)', async () => {
        const user = userEvent.setup();
        const onParentKeyDown = vi.fn();
        const setter = vi.fn();
        render(
            <div onKeyDown={onParentKeyDown}>
                <ClickInput
                    currentStr="Segment"
                    setter={setter}
                    Tag="h2"
                    className="segmentTitle"
                    isDesactivated={false}
                />
            </div>
        );

        await user.click(screen.getByRole('button'));
        const input = screen.getByRole('textbox');
        await user.type(input, ' ');

        expect(onParentKeyDown).not.toHaveBeenCalled();
    });
});
