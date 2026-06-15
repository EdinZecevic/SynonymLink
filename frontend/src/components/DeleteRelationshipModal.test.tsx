import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DeleteRelationshipModal } from './DeleteRelationshipModal';

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
  Unlink: () => <div data-testid="unlink-icon" />,
}));

describe('DeleteRelationshipModal Component', () => {
  const defaultProps = {
    isOpen: true,
    word1: 'clean',
    word2: 'wash',
    loading: false,
    error: '',
    onCancel: vi.fn(),
    onConfirm: vi.fn(),
  };

  it('does not render anything when isOpen is false', () => {
    const { container } = render(<DeleteRelationshipModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly when open', () => {
    render(<DeleteRelationshipModal {...defaultProps} />);
    expect(screen.getByText('dashboard.deleteLinkModalTitle')).toBeInTheDocument();
    expect(screen.getByText(/clean/)).toBeInTheDocument();
    expect(screen.getByText(/wash/)).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancelMock = vi.fn();
    render(<DeleteRelationshipModal {...defaultProps} onCancel={onCancelMock} />);
    
    const cancelBtn = screen.getByText('dashboard.deleteLinkCancelBtn');
    fireEvent.click(cancelBtn);
    expect(onCancelMock).toHaveBeenCalled();
  });

  it('calls onConfirm when confirm/disconnect button is clicked', () => {
    const onConfirmMock = vi.fn();
    render(<DeleteRelationshipModal {...defaultProps} onConfirm={onConfirmMock} />);
    
    const confirmBtn = screen.getByText('dashboard.deleteLinkConfirmBtn');
    fireEvent.click(confirmBtn);
    expect(onConfirmMock).toHaveBeenCalled();
  });
});
