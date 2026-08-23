// serviceConfig.js — defines the extra fields each service type collects,
// beyond the common location + timing fields every request shares.
import { Droplets, Shirt, Flame, Wrench, Briefcase } from 'lucide-react';

export const SERVICE_CONFIG = {
  water: {
    label: 'Water',
    icon: Droplets,
    tagline: "Tell us what you need and we'll get it to your door.",
    fields: [
      {
        name: 'waterType',
        label: 'Type of water',
        type: 'select',
        options: ['Sachet water', 'Bottled water (small)', 'Bottled water (large)', 'Gallon refill'],
      },
      { name: 'quantity', label: 'Quantity', type: 'number', placeholder: 'e.g. 2', min: 1 },
    ],
  },
  laundry: {
    label: 'Laundry',
    icon: Shirt,
    tagline: 'Pickup, washing, and return — one request away.',
    fields: [
      {
        name: 'loadSize',
        label: 'Load size',
        type: 'select',
        options: ['Small (up to 5 items)', 'Medium (6–15 items)', 'Large (16+ items)'],
      },
      {
        name: 'instructions',
        label: 'Special instructions',
        type: 'textarea',
        placeholder: 'e.g. separate whites, delicate fabric, fold only…',
        optional: true,
      },
    ],
  },
  gas: {
    label: 'Gas',
    icon: Flame,
    tagline: 'Refill or exchange, from a licensed LPG provider.',
    fields: [
      {
        name: 'requestType',
        label: 'Request type',
        type: 'select',
        options: ['Refill', 'Exchange'],
      },
      {
        name: 'cylinderSize',
        label: 'Cylinder size',
        type: 'select',
        options: ['3kg', '6kg', '14.5kg', 'Other'],
      },
    ],
  },
  repairs: {
    label: 'Repairs',
    icon: Wrench,
    tagline: 'Tell us what broke — we find the right technician.',
    fields: [
      {
        name: 'repairCategory',
        label: 'Repair category',
        type: 'select',
        options: [
          'Electrical', 'Plumbing', 'Phone', 'Laptop/Computer', 'Fan', 'Furniture', 'Door/Lock', 'Other',
        ],
      },
      {
        name: 'problem',
        label: "What's wrong?",
        type: 'textarea',
        placeholder: 'e.g. My socket isn\u2019t working…',
      },
      { name: 'photo', label: 'Upload a photo (optional)', type: 'file', optional: true },
    ],
  },
};

/**
 * Returns the curated config for one of the 4 University quick-services, or a
 * generic fallback for any other profession (e.g. "hairdresser", "tutor") —
 * so a request for an arbitrary profession still gets a working form and a
 * sensible icon/label instead of erroring out.
 */
export function getServiceConfig(serviceType) {
  const key = (serviceType || '').toLowerCase();
  if (SERVICE_CONFIG[key]) return SERVICE_CONFIG[key];

  const label = serviceType
    ? serviceType.charAt(0).toUpperCase() + serviceType.slice(1)
    : 'Service';

  return {
    label,
    icon: Briefcase,
    tagline: `Tell us what you need from a ${label.toLowerCase()}.`,
    fields: [
      {
        name: 'description',
        label: 'Describe what you need',
        type: 'textarea',
        placeholder: 'What do you need help with?',
      },
      { name: 'photo', label: 'Upload a photo (optional)', type: 'file', optional: true },
    ],
  };
}
