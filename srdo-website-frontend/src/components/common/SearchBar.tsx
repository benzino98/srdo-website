import React from "react";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
  onSubmit,
  placeholder = "Search...",
}) => {
  return (
    <form onSubmit={onSubmit} className="w-full">
      <input
        type="text"
        id="news-search"
        value={searchTerm}
        onChange={onSearchChange}
        placeholder={placeholder}
        className="w-full px-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
      />
    </form>
  );
};

export default SearchBar;
