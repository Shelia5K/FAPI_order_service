'use client';

import type { ProductDTO } from '@fapi/shared';
import styles from '../page.module.css';

interface ProductCardProps {
  product: ProductDTO;
  isSelected: boolean;
  onSelect: () => void;
}

export function ProductCard({ product, isSelected, onSelect }: ProductCardProps) {
  const isSoldOut = product.quantity === 0;

  const shortDescription =
    product.description && product.description.length > 100
      ? `${product.description.substring(0, 100)}...`
      : product.description;

  const handleClick = () => {
    if (!isSoldOut) {
      onSelect();
    }
  };

  return (
    <div
      className={`${styles.productCard} ${isSelected ? styles.selected : ''} ${
        isSoldOut ? styles.soldOut : ''
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if ((event.key === 'Enter' || event.key === ' ') && !isSoldOut) {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      {isSoldOut && <div className={styles.soldBadge}>VYPRODÁNO</div>}
      <h3 className={styles.productTitle}>{product.title}</h3>
      {shortDescription && (
        <p className={styles.productDescription}>{shortDescription}</p>
      )}
      <p className={styles.productPrice}>{product.formattedPrice}</p>
      {!isSoldOut && (
        <button
          type="button"
          className={`${styles.selectButton} ${
            isSelected ? styles.selectedButton : ''
          }`}
          onClick={(event) => {
            event.stopPropagation();
            onSelect();
          }}
        >
          {isSelected ? '✓ Vybráno' : 'Vybrat'}
        </button>
      )}
    </div>
  );
}

