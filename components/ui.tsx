import React, { ReactNode, createContext, useContext } from 'react';

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children: ReactNode;
}
export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', children, className, ...props }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  const sizeClasses = {
    sm: "h-9 px-3",
    md: "h-10 px-4 py-2",
    lg: "h-11 px-8",
    icon: "h-10 w-10"
  };
  const variantClasses = {
    primary: "bg-primary-600 text-white hover:bg-primary-600/90",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-100/80",
    danger: "bg-red-600 text-white hover:bg-red-600/90",
    ghost: "hover:bg-slate-100 hover:text-slate-900",
    link: "text-primary-600 underline-offset-4 hover:underline",
  };
  
  return (
    <button className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}
export const Input: React.FC<InputProps> = ({ label, id, className, ...props }) => (
  <div className="w-full">
    {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
    <input
      id={id}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  </div>
);

// --- Modal / Dialog ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, description, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b rounded-t">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="flex items-center justify-end p-6 space-x-2 border-t border-gray-200 rounded-b">{footer}</div>}
      </div>
    </div>
  );
};

// --- Spinner ---
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className={`animate-spin rounded-full border-4 border-t-transparent border-primary-600 ${sizeClasses[size]}`} role="status">
      <span className="sr-only">Loading...</span>
    </div>
  );
};


// --- Card ---
export const Card: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`rounded-xl border bg-card text-card-foreground shadow ${className}`}>
    {children}
  </div>
);
export const CardHeader: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
export const CardTitle: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
export const CardDescription: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => <p className={`text-sm text-slate-500 ${className}`}>{children}</p>;
export const CardContent: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;
export const CardFooter: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => <div className={`flex items-center p-6 pt-0 ${className}`}>{children}</div>;


// --- Tabs ---
const TabsContext = createContext<{ value: string; onValueChange: (value: string) => void; }>({ value: '', onValueChange: () => {} });
export const Tabs: React.FC<{ defaultValue: string; children: ReactNode; onValueChange?: (value: string) => void; }> = ({ defaultValue, children, onValueChange = () => {} }) => {
  const [value, setValue] = React.useState(defaultValue);
  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    onValueChange(newValue);
  };
  return <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}><div>{children}</div></TabsContext.Provider>;
};
export const TabsList: React.FC<{ children: ReactNode; }> = ({ children }) => <div className="inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500">{children}</div>;
export const TabsTrigger: React.FC<{ value: string; children: ReactNode; }> = ({ value, children }) => {
  const { value: activeValue, onValueChange } = useContext(TabsContext);
  const isActive = activeValue === value;
  return (
    <button onClick={() => onValueChange(value)} className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${isActive ? 'bg-background text-foreground shadow-sm' : ''}`}>
      {children}
    </button>
  );
};
export const TabsContent: React.FC<{ value: string; children: ReactNode; }> = ({ value, children }) => {
  const { value: activeValue } = useContext(TabsContext);
  return activeValue === value ? <div className="mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">{children}</div> : null;
};
