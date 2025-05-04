import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white py-8 border-t border-gray-200">
      <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
        <p>© {currentYear} LectureLoop. Created for university students.</p>
      </div>
    </footer>
  );
};

export default Footer;
