// De los datos del campo a lo que la pantalla dibuja.
//
//   servidor → datos → MAPPERS → pantalla
//
// Funciones puras: reciben los datos crudos y la hora, y devuelven textos
// listos. Las cuentas (agrupar el stock, sumar la lluvia) las hace el
// dominio; acá se les da forma para mostrarlas.

import { groupStock, rainfallByMonth, rainfallTotal, type Animal, type CampoData, type GroupRain, type StockGroup } from '@/domain/campo';
import { formatDate, formatMonth, formatNumber, formatQuantity, MISSING } from '@/domain/format';

import { animalTag } from './animalTag';
import type { AnimalRowModel, CampoHeaderModel, PalpationModel, RainfallModel, StockModel } from './model';

export function toCampoHeader(campo: CampoData['campo']): CampoHeaderModel {
  return { title: campo.name, subtitle: `${campo.locality} · ${formatQuantity(campo.hectares, 'ha')}` };
}

export function toStockModel(stock: CampoData['stock'], now: string): StockModel {
  return {
    total: formatNumber(stock.total_head_count),
    groups: groupStock(stock.by_category).map((group) => ({
      key: group.name,
      name: group.name,
      count: formatNumber(group.headCount),
      value: group.headCount,
      detail: weightDetail(group, now),
      categoryId: group.categoryId,
    })),
  };
}

function weightDetail(group: StockGroup, now: string): string {
  if (group.avgWeightKg === null || group.lastWeighingDate === null) return 'Sin pesaje';
  return `${formatQuantity(group.avgWeightKg, 'kg')} promedio · pesaje ${formatDate(group.lastWeighingDate, now)}`;
}

export function toPalpationModel(palpation: CampoData['palpation'], now: string): PalpationModel {
  return {
    rate: `${formatNumber(palpation.pregnancy_rate)} %`,
    progress: palpation.pregnancy_rate / 100,
    pregnant: formatNumber(palpation.pregnant),
    empty: formatNumber(palpation.empty),
    caption: `${formatNumber(palpation.palpated)} tactadas · ${formatDate(palpation.date, now)}`,
  };
}

/** Cuánto mide, de 0 a 1, la barra de un mes sin registro: un hueco visible, no una barra. */
const MISSING_BAR_HEIGHT = 1 / 3;

/**
 * La lluvia del último año. `groupRains` son las lluvias anotadas en el
 * grupo: se suman al mes en curso, así que si alguien carga o corrige una,
 * el total cambia sin hacer nada más.
 */
export function toRainfallModel(rainfall: CampoData['rainfall'], groupRains: GroupRain[], now: string): RainfallModel {
  const months = rainfallByMonth(rainfall.months, groupRains);
  const highest = Math.max(...months.map((month) => month.mm ?? 0), 1);
  const current = months.find((month) => month.partial);

  return {
    total: formatNumber(rainfallTotal(months)),
    totalCaption: `${rainfall.unit} en el último año`,
    source: `Pluviómetro ${rainfall.gauge} · media histórica ${formatQuantity(rainfall.historical_annual_avg_mm, rainfall.unit)}`,
    bars: months.map((month) => ({
      key: month.month,
      label: formatMonth(month.month),
      // Un mes sin registro no es un mes en cero: uno dice "s/d" y el otro "0".
      value: month.mm === null ? 's/d' : formatNumber(month.mm, 0),
      height: month.mm === null ? MISSING_BAR_HEIGHT : Math.max(month.mm / highest, 0.02),
      partial: month.partial,
      missing: month.mm === null,
    })),
    note: current
      ? `Este mes van ${formatQuantity(current.mm ?? 0, rainfall.unit)}` +
        (current.until ? `: el pluviómetro hasta el ${formatDate(current.until, now)}, más lo anotado en el grupo.` : '.')
      : null,
  };
}

export function toAnimalRow(animal: Animal): AnimalRowModel {
  return {
    id: animal.id,
    caravana: animal.identifier,
    title: `${animal.category_name} · ${animal.breed}`,
    place: `${animal.herd} · ${animal.lote}`,
    weight: animal.last_weight_kg === null ? MISSING : formatQuantity(animal.last_weight_kg, 'kg'),
    tag: animalTag(animal),
  };
}

export function animalCountLabel(count: number): string {
  return count === 1 ? '1 animal' : `${formatNumber(count)} animales`;
}
