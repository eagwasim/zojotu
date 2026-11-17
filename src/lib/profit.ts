/**
 * The single definition of what a sale earns. Used by the dashboard and the watch page
 * so the two can never disagree.
 *
 *   fees        = platform fee + shipping & insurance
 *   cost basis  = purchase cost + parts
 *   profit      = sale price − fees − cost basis
 */
export interface SaleAmounts {
  grossSalePrice: number;
  platformFee?: number | null;
  shippingInsurance?: number | null;
}

export function saleFees(sale: SaleAmounts): number {
  return (sale.platformFee || 0) + (sale.shippingInsurance || 0);
}

export function saleNetRevenue(sale: SaleAmounts): number {
  return sale.grossSalePrice - saleFees(sale);
}

export function saleProfit(sale: SaleAmounts, costBasis: number): number {
  return saleNetRevenue(sale) - costBasis;
}
