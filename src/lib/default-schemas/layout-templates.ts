// Default schema definitions for header and footer templates
// These can be used to quickly set up standard header/footer structures

export const defaultHeaderSchema = {
  name: "Default Header Schema",
  description: "A standard header schema with logo, navigation, and CTA",
  sections: [
    {
      name: "Header Content",
      description: "Main header content and navigation",
      order: 0,
      fields: [
        {
          name: "Logo",
          field_key: "logo",
          type: "image",
          required: true,
          order: 0,
          settings: {
            maxSize: 5242880, // 5MB
            allowedTypes: ["image/png", "image/jpeg", "image/svg+xml"],
          },
        },
        {
          name: "Navigation Menu",
          field_key: "navigation_menu",
          type: "navigation_menu",
          required: true,
          order: 1,
          settings: {
            maxDepth: 3,
            allowIcons: true,
          },
        },
        {
          name: "CTA Button Text",
          field_key: "cta_text",
          type: "text",
          required: false,
          order: 2,
          settings: {
            placeholder: "Get Started",
          },
        },
        {
          name: "CTA Button Link",
          field_key: "cta_link",
          type: "text",
          required: false,
          order: 3,
          settings: {
            placeholder: "/contact",
          },
        },
        {
          name: "CTA Button Style",
          field_key: "cta_style",
          type: "select",
          required: false,
          order: 4,
          settings: {
            options: [
              { label: "Primary", value: "primary" },
              { label: "Secondary", value: "secondary" },
              { label: "Outline", value: "outline" },
            ],
          },
          default_value: "primary",
        },
      ],
    },
    {
      name: "Header Settings",
      description: "Configuration options for header behavior",
      order: 1,
      fields: [
        {
          name: "Sticky Header",
          field_key: "is_sticky",
          type: "checkbox",
          required: false,
          order: 0,
          default_value: "true",
        },
        {
          name: "Transparent Background",
          field_key: "is_transparent",
          type: "checkbox",
          required: false,
          order: 1,
          default_value: "false",
        },
        {
          name: "Background Color",
          field_key: "background_color",
          type: "color",
          required: false,
          order: 2,
          default_value: "#ffffff",
        },
        {
          name: "Text Color",
          field_key: "text_color",
          type: "color",
          required: false,
          order: 3,
          default_value: "#000000",
        },
      ],
    },
  ],
};

export const defaultFooterSchema = {
  name: "Default Footer Schema",
  description: "A standard footer schema with multiple columns and social links",
  sections: [
    {
      name: "Footer Content",
      description: "Main footer content and links",
      order: 0,
      fields: [
        {
          name: "Company Logo",
          field_key: "logo",
          type: "image",
          required: false,
          order: 0,
          settings: {
            maxSize: 5242880, // 5MB
            allowedTypes: ["image/png", "image/jpeg", "image/svg+xml"],
          },
        },
        {
          name: "Company Description",
          field_key: "description",
          type: "textarea",
          required: false,
          order: 1,
          settings: {
            placeholder: "Brief description of your company...",
            rows: 3,
          },
        },
        {
          name: "Column 1 Title",
          field_key: "column1_title",
          type: "text",
          required: false,
          order: 2,
          settings: {
            placeholder: "Products",
          },
        },
        {
          name: "Column 1 Links",
          field_key: "column1_links",
          type: "navigation_menu",
          required: false,
          order: 3,
          settings: {
            maxDepth: 1, // Footer links are usually flat
            allowIcons: false,
          },
        },
        {
          name: "Column 2 Title",
          field_key: "column2_title",
          type: "text",
          required: false,
          order: 4,
          settings: {
            placeholder: "Company",
          },
        },
        {
          name: "Column 2 Links",
          field_key: "column2_links",
          type: "navigation_menu",
          required: false,
          order: 5,
          settings: {
            maxDepth: 1,
            allowIcons: false,
          },
        },
        {
          name: "Column 3 Title",
          field_key: "column3_title",
          type: "text",
          required: false,
          order: 6,
          settings: {
            placeholder: "Resources",
          },
        },
        {
          name: "Column 3 Links",
          field_key: "column3_links",
          type: "navigation_menu",
          required: false,
          order: 7,
          settings: {
            maxDepth: 1,
            allowIcons: false,
          },
        },
      ],
    },
    {
      name: "Social Links",
      description: "Social media links and icons",
      order: 1,
      fields: [
        {
          name: "Facebook URL",
          field_key: "facebook_url",
          type: "text",
          required: false,
          order: 0,
          settings: {
            placeholder: "https://facebook.com/yourpage",
          },
        },
        {
          name: "Twitter URL",
          field_key: "twitter_url",
          type: "text",
          required: false,
          order: 1,
          settings: {
            placeholder: "https://twitter.com/yourhandle",
          },
        },
        {
          name: "LinkedIn URL",
          field_key: "linkedin_url",
          type: "text",
          required: false,
          order: 2,
          settings: {
            placeholder: "https://linkedin.com/company/yourcompany",
          },
        },
        {
          name: "Instagram URL",
          field_key: "instagram_url",
          type: "text",
          required: false,
          order: 3,
          settings: {
            placeholder: "https://instagram.com/yourhandle",
          },
        },
        {
          name: "YouTube URL",
          field_key: "youtube_url",
          type: "text",
          required: false,
          order: 4,
          settings: {
            placeholder: "https://youtube.com/@yourchannel",
          },
        },
      ],
    },
    {
      name: "Footer Bottom",
      description: "Copyright and legal links",
      order: 2,
      fields: [
        {
          name: "Copyright Text",
          field_key: "copyright",
          type: "text",
          required: false,
          order: 0,
          default_value: "© 2025 Your Company. All rights reserved.",
        },
        {
          name: "Legal Links",
          field_key: "legal_links",
          type: "navigation_menu",
          required: false,
          order: 1,
          settings: {
            maxDepth: 1,
            allowIcons: false,
          },
        },
      ],
    },
    {
      name: "Footer Settings",
      description: "Configuration options for footer appearance",
      order: 3,
      fields: [
        {
          name: "Background Color",
          field_key: "background_color",
          type: "color",
          required: false,
          order: 0,
          default_value: "#1a1a1a",
        },
        {
          name: "Text Color",
          field_key: "text_color",
          type: "color",
          required: false,
          order: 1,
          default_value: "#ffffff",
        },
      ],
    },
  ],
};

export const minimalHeaderSchema = {
  name: "Minimal Header Schema",
  description: "A simple header with just logo and basic navigation",
  sections: [
    {
      name: "Header Content",
      description: "Minimal header content",
      order: 0,
      fields: [
        {
          name: "Logo",
          field_key: "logo",
          type: "image",
          required: true,
          order: 0,
          settings: {
            maxSize: 5242880,
            allowedTypes: ["image/png", "image/jpeg", "image/svg+xml"],
          },
        },
        {
          name: "Navigation Menu",
          field_key: "navigation_menu",
          type: "navigation_menu",
          required: true,
          order: 1,
          settings: {
            maxDepth: 2,
            allowIcons: false,
          },
        },
      ],
    },
  ],
};

export const minimalFooterSchema = {
  name: "Minimal Footer Schema",
  description: "A simple footer with copyright and basic links",
  sections: [
    {
      name: "Footer Content",
      description: "Minimal footer content",
      order: 0,
      fields: [
        {
          name: "Copyright Text",
          field_key: "copyright",
          type: "text",
          required: false,
          order: 0,
          default_value: "© 2025 Your Company. All rights reserved.",
        },
        {
          name: "Footer Links",
          field_key: "footer_links",
          type: "navigation_menu",
          required: false,
          order: 1,
          settings: {
            maxDepth: 1,
            allowIcons: false,
          },
        },
      ],
    },
  ],
};


