import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'; // Para usar matchers como toBeInTheDocument
import MessageInput from './MessageInput';

// Describimos el conjunto de pruebas para el componente MessageInput
describe('MessageInput Component', () => {

  // Test 1: El componente se renderiza sin errores
  test('renders input field and send button', () => {
    render(<MessageInput onSendMessage={() => {}} loading={false} />);
    
    // Buscamos el campo de texto por su etiqueta placeholder/label
    expect(screen.getByLabelText(/escribe tu mensaje/i)).toBeInTheDocument();
    
    // Buscamos el botón por su texto
    expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument();
  });

  // Test 2: El botón de enviar está deshabilitado cuando el input está vacío
  test('send button is disabled when input is empty', () => {
    render(<MessageInput onSendMessage={() => {}} loading={false} />);
    
    const sendButton = screen.getByRole('button', { name: /enviar/i });
    expect(sendButton).toBeDisabled();
  });

  // Test 3: El botón de enviar se habilita cuando se escribe en el input
  test('send button is enabled when input has text', () => {
    render(<MessageInput onSendMessage={() => {}} loading={false} />);
    
    const inputField = screen.getByLabelText(/escribe tu mensaje/i);
    const sendButton = screen.getByRole('button', { name: /enviar/i });

    // Simulamos la escritura del usuario en el campo de texto
    fireEvent.change(inputField, { target: { value: 'Hola' } });
    
    // Ahora el botón debería estar habilitado
    expect(sendButton).not.toBeDisabled();
  });

  // Test 4: Al hacer clic en el botón, se llama a onSendMessage con el texto correcto
  test('calls onSendMessage with the correct text when send button is clicked', () => {
    const mockOnSendMessage = jest.fn(); // Creamos una "función espía"
    render(<MessageInput onSendMessage={mockOnSendMessage} loading={false} />);
    
    const inputField = screen.getByLabelText(/escribe tu mensaje/i);
    const sendButton = screen.getByRole('button', { name: /enviar/i });

    // Escribimos en el input
    fireEvent.change(inputField, { target: { value: 'Hola mundo' } });
    
    // Hacemos clic en el botón
    fireEvent.click(sendButton);
    
    // Verificamos que nuestra función espía fue llamada una vez
    expect(mockOnSendMessage).toHaveBeenCalledTimes(1);
    
    // Verificamos que fue llamada con el argumento correcto
    expect(mockOnSendMessage).toHaveBeenCalledWith('Hola mundo');
  });

  // Test 5: El input y el botón se deshabilitan cuando loading es true
  test('input and button are disabled when loading is true', () => {
    render(<MessageInput onSendMessage={() => {}} loading={true} />);
    
    expect(screen.getByLabelText(/escribe tu mensaje/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /enviando/i })).toBeDisabled();
  });
});