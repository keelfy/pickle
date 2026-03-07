import useFilterQueryState from '@/query-params/filter'
import React from 'react'
import { Button } from './button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './drawer'
import { Input } from './input'

export type FiltersDrawerFilterOption = {
  label: string
  value: string
  icon?: React.ElementType
}

export type FiltersDrawerFilter = {
  type: 'select' | 'input'
  label: string
  field: string
  options?: FiltersDrawerFilterOption[]
  placeholder?: string
}

type FiltersDrawerProps = React.PropsWithChildren<{
  filters: FiltersDrawerFilter[]
}>

export default function FiltersDrawer({
  filters,
  children,
}: FiltersDrawerProps) {
  const { addFilter, getFilter, clearFilters } = useFilterQueryState()
  const [inputValues, setInputValues] = React.useState<Record<string, string>>(
    filters.reduce(
      (acc, filter) => {
        if (filter.type === 'input') {
          acc[filter.field] = ''
        }
        return acc
      },
      {} as Record<string, string>,
    ),
  )
  return (
    <Drawer>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {filters.length > 0 ? filters[0].label : 'Filters'}
          </DrawerTitle>
          <DrawerDescription className="hidden" />
        </DrawerHeader>
        <div className="flex flex-col items-center justify-center gap-2">
          {filters.map((filter, index) => {
            switch (filter.type) {
              case 'select':
                return (
                  <div
                    key={filter.field}
                    className="flex flex-col items-center justify-center gap-2"
                  >
                    {index > 0 && (
                      <h2 className="pt-4 text-lg font-semibold">
                        {filter.label}
                      </h2>
                    )}
                    <div className="grid grid-cols-3 gap-2">
                      {filter.options?.map((option) => (
                        <DrawerClose key={option.value} asChild>
                          <Button
                            variant={
                              option.value === getFilter(filter.field)?.value
                                ? 'default'
                                : 'link'
                            }
                            onClick={() =>
                              addFilter(filter.field, option.value)
                            }
                          >
                            {option.icon && <option.icon className="size-4" />}
                            {option.label}
                          </Button>
                        </DrawerClose>
                      ))}
                    </div>
                  </div>
                )
              case 'input':
                return (
                  <div
                    key={filter.field}
                    className="flex flex-col items-center justify-center gap-2"
                  >
                    {index > 0 && (
                      <h2 className="pt-4 text-lg font-semibold">
                        {filter.label}
                      </h2>
                    )}
                    <div className="flex flex-nowrap">
                      <Input
                        placeholder={filter.placeholder}
                        className="h-9 rounded-r-none"
                        value={inputValues[filter.field]}
                        onChange={(e) =>
                          setInputValues({
                            ...inputValues,
                            [filter.field]: e.target.value,
                          })
                        }
                      />
                      <DrawerClose asChild>
                        <Button
                          variant="secondary"
                          className="rounded-l-none"
                          onClick={() =>
                            addFilter(filter.field, inputValues[filter.field])
                          }
                        >
                          Apply
                        </Button>
                      </DrawerClose>
                    </div>
                  </div>
                )
              default:
                return null
            }
          })}
        </div>
        <DrawerFooter className="mt-4">
          <DrawerClose asChild>
            <Button variant="destructive" onClick={clearFilters}>
              Clear filters
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
