import { useMemo, useState } from 'react';

import { filterAnimals, groupRainsFromDatos } from '@/domain/campo';
import { useCampoData } from '@/hooks/useCampoData';
import { useNow } from '@/hooks/useNow';
import { useDatos } from '@/store/chatStore';

import { animalCountLabel, toAnimalRow, toCampoHeader, toPalpationModel, toRainfallModel, toStockModel } from './mappers';
import type { CategoryChipModel } from './model';

export type CampoSection = 'resumen' | 'animales';

/**
 * Lo que la pantalla de Campo necesita, ya listo para dibujar.
 *
 *   servidor → datos → mappers → pantalla
 *
 * Lee los datos del campo y los del grupo, los pasa por los mappers y guarda
 * lo único que es de la pantalla: en qué pestaña está, qué se busca y por
 * qué categoría se filtra.
 */
export function useCampoScreen() {
  const data = useCampoData();
  const datos = useDatos();
  const now = useNow();

  const [section, setSection] = useState<CampoSection>('resumen');
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const header = useMemo(() => toCampoHeader(data.campo), [data.campo]);
  const stock = useMemo(() => toStockModel(data.stock, now), [data.stock, now]);
  const palpation = useMemo(() => toPalpationModel(data.palpation, now), [data.palpation, now]);

  // Lo que se anota en el grupo cuenta acá: si alguien carga o corrige una
  // lluvia, `datos` cambia y el total del mes se vuelve a calcular.
  const rainfall = useMemo(
    () => toRainfallModel(data.rainfall, groupRainsFromDatos(datos, data.rainfall.gauge), now),
    [data.rainfall, datos, now],
  );

  // Las categorías salen de los datos: no hay una lista fija.
  const categories: CategoryChipModel[] = useMemo(
    () => data.stock.by_category.map((category) => ({ id: category.category_id, label: category.category_name })),
    [data.stock.by_category],
  );

  // Solo los activos, para que la lista coincida con el stock.
  const animals = useMemo(
    () => filterAnimals(data.animals, { query, categoryId, status: 'active' }).map(toAnimalRow),
    [data.animals, query, categoryId],
  );

  // Tocar una categoría en el stock abre la lista ya filtrada.
  function openCategory(id: number) {
    setCategoryId(id);
    setSection('animales');
  }

  return {
    header,
    stock,
    palpation,
    rainfall,
    section,
    setSection,
    openCategory,
    animalList: { query, setQuery, categoryId, setCategoryId, categories, rows: animals, countLabel: animalCountLabel(animals.length) },
  };
}

export type AnimalListModel = ReturnType<typeof useCampoScreen>['animalList'];
