"use client";

import { useState } from "react";

import bookUrlConverterStyles from "./assets/styles/bookUrlConverter.module.css";

import { Button, Form, Input, Label, TextField } from "react-aria-components";

export const BookUrlConverter = () => {
  const [bookUrl, setBookUrl] = useState("");
  
  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookUrl) return;
    
    try {
      // Convert the book URL to base64Url format using TextEncoder for proper Unicode handling
      const bytes = new TextEncoder().encode(bookUrl);
      const binString = Array.from(bytes, byte => String.fromCodePoint(byte)).join('');
      const base64 = btoa(binString);
      const base64Url = base64
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      
      // Redirect to the /read page with the base64 URL as a query parameter
      window.location.href = new URL(
        `read?book=https://publication-server.readium.org/${encodeURIComponent(base64Url)}/manifest.json`, 
        window.location.href
      ).href;
    } catch (error) {
      console.error("Error encoding URL:", error);
      // You could add user-friendly error handling here
    }
  };

  return (
    <>
    <Form 
      className={ bookUrlConverterStyles.bookConverterForm }
      onSubmit={ handleAction }
    >
      <TextField>
        <Label
        className={ bookUrlConverterStyles.bookConverterFormLabel }
        >
          Load an EPUB publication from a remote server (it must support byte-range requests):
        </Label>
        <Input 
          className={ bookUrlConverterStyles.bookConverterFormInput }
          value={ bookUrl }
          onChange={ (e) => setBookUrl(e.target.value) }
          placeholder="https://www.example.org/ebook.epub"
        />
      </TextField>
      <Button 
        className={ bookUrlConverterStyles.bookConverterFormButton } 
        type="submit" 
      >
        Load
      </Button>
    </Form>
  </>
  )
}