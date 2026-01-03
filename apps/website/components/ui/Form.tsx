import React, { FormEvent, ReactNode } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface FormField {
  name: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea';
  label: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  value?: string;
}

interface FormProps {
  title?: string;
  fields: FormField[];
  onSubmit: (data: Record<string, string>) => void;
  submitButtonText?: string;
  submitButtonVariant?: 'primary' | 'secondary' | 'danger' | 'success';
  loading?: boolean;
  children?: ReactNode;
  className?: string;
}

const Form: React.FC<FormProps> = ({
  title,
  fields,
  onSubmit,
  submitButtonText = 'Gönder',
  submitButtonVariant = 'primary',
  loading = false,
  children,
  className = '',
}) => {
  const [formData, setFormData] = React.useState<Record<string, string>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} gerekli`;
      } else if (field.type === 'email' && formData[field.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.name])) {
          newErrors[field.name] = 'Geçerli bir e-posta girin';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {title && (
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {title}
        </h2>
      )}

      {fields.map(field => {
        if (field.type === 'textarea') {
          return (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <textarea
                name={field.name}
                value={formData[field.name] || field.value || ''}
                onChange={handleChange}
                placeholder={field.placeholder}
                rows={4}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-galatasaray-yellow transition ${
                  errors[field.name]
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-galatasaray-yellow'
                }`}
              />
              {errors[field.name] && (
                <p className="text-red-500 text-sm mt-1">{errors[field.name]}</p>
              )}
            </div>
          );
        }

        return (
          <Input
            key={field.name}
            type={field.type as any}
            name={field.name}
            label={field.label}
            placeholder={field.placeholder}
            required={field.required}
            error={errors[field.name]}
            value={formData[field.name] || field.value || ''}
            onChange={handleChange}
          />
        );
      })}

      {children && <div>{children}</div>}

      <Button
        type="submit"
        variant={submitButtonVariant}
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Yükleniyor...' : submitButtonText}
      </Button>
    </form>
  );
};

export default Form;
