import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DeleteWarningModal } from './DeleteWarningModal';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  Trans: ({ i18nKey, children }: { i18nKey?: string; children?: React.ReactNode }) => {
    if (children) return children;
    return i18nKey;
  },
}));

// Mock lucide-react to avoid icon loading issues
vi.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-icon" />,
}));

describe('DeleteWarningModal Component', () => {
  const defaultProps = {
    isOpen: true,
    word: 'testword',
    preview: {
      targetWord: 'testword',
      firstConnections: ['synonym1'],
      secondConnections: ['synonym2'],
    },
    mode: 'single' as const,
    loading: false,
    error: '',
    setMode: vi.fn(),
    onCancel: vi.fn(),
    onConfirm: vi.fn(),
  };

  it('does not render anything when isOpen is false', () => {
    const { container } = render(<DeleteWarningModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly when open', () => {
    render(<DeleteWarningModal {...defaultProps} />);
    expect(screen.getByText('dashboard.deleteModalTitle')).toBeInTheDocument();
    expect(screen.getByText('testword')).toBeInTheDocument();
  });

  it('calls setMode when clicking single or cascade tabs', () => {
    const setModeMock = vi.fn();
    render(<DeleteWarningModal {...defaultProps} setMode={setModeMock} />);
    
    const singleTab = screen.getByText('dashboard.deleteTabSingle');
    const cascadeTab = screen.getByText('dashboard.deleteTabCascade');

    fireEvent.click(singleTab);
    expect(setModeMock).toHaveBeenCalledWith('single');

    fireEvent.click(cascadeTab);
    expect(setModeMock).toHaveBeenCalledWith('cascade');
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancelMock = vi.fn();
    render(<DeleteWarningModal {...defaultProps} onCancel={onCancelMock} />);
    
    const cancelBtn = screen.getByText('dashboard.deleteCancelBtn');
    fireEvent.click(cancelBtn);
    expect(onCancelMock).toHaveBeenCalled();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirmMock = vi.fn();
    render(<DeleteWarningModal {...defaultProps} onConfirm={onConfirmMock} />);
    
    const confirmBtn = screen.getByText('dashboard.deleteConfirmBtn');
    fireEvent.click(confirmBtn);
    expect(onConfirmMock).toHaveBeenCalled();
  });
});
