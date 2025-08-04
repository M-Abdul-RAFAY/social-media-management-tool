"use client";

import { useState, useEffect } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { usePages } from "@/hooks/usePages";
import { IPage } from "@/types/db";

interface PageSwitcherProps {
  onPageChange?: (page: IPage | null) => void;
}

export function PageSwitcher({ onPageChange }: PageSwitcherProps) {
  const { pages, loading, error } = usePages();
  const [selectedPage, setSelectedPage] = useState<IPage | null>(null);

  useEffect(() => {
    if (pages.length > 0 && !selectedPage) {
      setSelectedPage(pages[0]);
      onPageChange?.(pages[0]);
    }
  }, [pages, selectedPage, onPageChange]);

  const handlePageChange = (page: IPage) => {
    setSelectedPage(page);
    onPageChange?.(page);
  };

  if (loading) {
    return (
      <div className="w-72">
        <div className="animate-pulse bg-gray-200 h-10 rounded-md"></div>
      </div>
    );
  }

  if (error) {
    return <div className="w-72 text-sm text-red-600">Error loading pages</div>;
  }

  if (pages.length === 0) {
    return <div className="w-72 text-sm text-gray-500">No pages connected</div>;
  }

  const allPagesOption = {
    _id: "all",
    name: "All Pages",
    platform: "all" as const,
    picture: undefined,
  };

  const options = [allPagesOption, ...pages];

  return (
    <Listbox value={selectedPage} onChange={handlePageChange}>
      <div className="relative w-72">
        <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left shadow-sm ring-1 ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm">
          <span className="flex items-center">
            {selectedPage?.picture && (
              <img
                src={selectedPage.picture}
                alt=""
                className="h-6 w-6 flex-shrink-0 rounded-full"
              />
            )}
            <span className="ml-3 block truncate font-medium">
              {selectedPage?.name || "Select a page"}
            </span>
            {selectedPage?.platform && selectedPage.platform !== "all" && (
              <span
                className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  selectedPage.platform === "facebook"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-pink-100 text-pink-800"
                }`}
              >
                {selectedPage.platform === "facebook" ? "FB" : "IG"}
              </span>
            )}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
            <ChevronUpDownIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </span>
        </Listbox.Button>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {options.map((page) => (
              <Listbox.Option
                key={page._id}
                className={({ active }) =>
                  `relative cursor-default select-none py-2 pl-3 pr-9 ${
                    active ? "bg-indigo-600 text-white" : "text-gray-900"
                  }`
                }
                value={page._id === "all" ? null : page}
              >
                {({ selected, active }) => (
                  <>
                    <div className="flex items-center">
                      {page.picture && (
                        <img
                          src={page.picture}
                          alt=""
                          className="h-6 w-6 flex-shrink-0 rounded-full"
                        />
                      )}
                      <span
                        className={`ml-3 block truncate ${
                          selected ? "font-semibold" : "font-normal"
                        }`}
                      >
                        {page.name}
                      </span>
                      {page.platform !== "all" && (
                        <span
                          className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            active
                              ? "bg-indigo-200 text-indigo-800"
                              : page.platform === "facebook"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-pink-100 text-pink-800"
                          }`}
                        >
                          {page.platform === "facebook" ? "FB" : "IG"}
                        </span>
                      )}
                    </div>

                    {selected ? (
                      <span
                        className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                          active ? "text-white" : "text-indigo-600"
                        }`}
                      >
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
}
