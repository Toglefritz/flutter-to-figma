import { ReusableWidget, Widget, WidgetType } from '../schema/types';
import { FigmaComponentSpec, ComponentVariant } from './figma-node-spec';
import { ComponentBuilder } from './component-builder';
import { VariantGroup } from './variant-manager';

/**
 * ComponentOrganizer handles the organization and structuring of components
 * in a logical Figma component library
 */
export class ComponentOrganizer {
  private componentBuilder: ComponentBuilder;

  constructor(componentBuilder?: ComponentBuilder) {
    this.componentBuilder = componentBuilder || new ComponentBuilder();
  }

  /**
   * Organize components into a structured library
   */
  organizeComponentLibrary(reusableWidgets: ReusableWidget[]): ComponentLibrary {
    // Create components from reusable widgets
    const components = reusableWidgets.map(widget => 
      this.componentBuilder.createAdvancedComponent(widget)
    );

    // Group components by category
    const categories = this.categorizeComponents(components, reusableWidgets);

    // Create library structure
    const library: ComponentLibrary = {
      name: 'Flutter Component Library',
      description: 'Components generated from Flutter widgets',
      categories: categories,
      metadata: {
        totalComponents: components.length,
        generatedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    return library;
  }

  /**
   * Create logical grouping for related components
   */
  createComponentGroups(components: FigmaComponentSpec[]): ComponentGroup[] {
    const groups: ComponentGroup[] = [];
    const groupMap = new Map<string, FigmaComponentSpec[]>();

    // Group components by type and functionality
    components.forEach(component => {
      const groupKey = this.determineComponentGroup(component);
      
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, []);
      }
      groupMap.get(groupKey)!.push(component);
    });

    // Convert map to structured groups
    groupMap.forEach((groupComponents, groupName) => {
      groups.push({
        name: groupName,
        description: this.generateGroupDescription(groupName, groupComponents),
        components: groupComponents,
        subGroups: this.createSubGroups(groupComponents)
      });
    });

    // Sort groups by priority
    return this.sortGroupsByPriority(groups);
  }

  /**
   * Add comprehensive component documentation
   */
  addComponentDocumentation(
    component: FigmaComponentSpec, 
    reusableWidget: ReusableWidget
  ): FigmaComponentSpec {
    const enhancedComponent: FigmaComponentSpec & { metadata: any } = {
      ...component,
      description: this.generateDetailedDescription(component, reusableWidget),
      // Add metadata for better organization
      metadata: {
        category: this.determineComponentCategory(reusableWidget),
        tags: this.generateComponentTags(reusableWidget),
        usageCount: reusableWidget.usageCount,
        complexity: this.assessComponentComplexity(reusableWidget),
        lastUpdated: new Date().toISOString(),
        examples: this.generateUsageExamples(reusableWidget)
      }
    };

    return enhancedComponent;
  }

  /**
   * Create Figma page structure for component library
   */
  createLibraryPageStructure(library: ComponentLibrary): LibraryPageStructure {
    const pages: LibraryPage[] = [];

    // Create overview page
    pages.push({
      name: '📚 Library Overview',
      description: 'Overview of all components in the library',
      sections: [{
        name: 'Getting Started',
        description: 'How to use this component library',
        components: []
      }]
    });

    // Create pages for each category
    library.categories.forEach(category => {
      const page: LibraryPage = {
        name: `${this.getCategoryIcon(category.name)} ${category.name}`,
        description: category.description,
        sections: this.createPageSections(category)
      };
      pages.push(page);
    });

    // Create utilities page
    pages.push({
      name: '🔧 Utilities',
      description: 'Utility components and helpers',
      sections: [{
        name: 'Icons',
        description: 'Icon components and placeholders',
        components: []
      }]
    });

    return {
      name: library.name,
      pages: pages,
      coverPage: this.createCoverPage(library)
    };
  }

  /**
   * Categorize components by functionality and type
   */
  private categorizeComponents(
    components: FigmaComponentSpec[], 
    reusableWidgets: ReusableWidget[]
  ): ComponentCategory[] {
    const categoryMap = new Map<string, ComponentCategoryData>();

    components.forEach((component, index) => {
      const widget = reusableWidgets[index];
      const categoryName = this.determineComponentCategory(widget);
      
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          components: [],
          widgets: [],
          priority: this.getCategoryPriority(categoryName)
        });
      }
      
      categoryMap.get(categoryName)!.components.push(component);
      categoryMap.get(categoryName)!.widgets.push(widget);
    });

    // Convert to structured categories
    const categories: ComponentCategory[] = [];
    categoryMap.forEach((data, categoryName) => {
      categories.push({
        name: categoryName,
        description: this.generateCategoryDescription(categoryName),
        components: data.components,
        groups: this.createComponentGroups(data.components),
        metadata: {
          componentCount: data.components.length,
          averageUsage: this.calculateAverageUsage(data.widgets),
          complexity: this.assessCategoryComplexity(data.widgets)
        }
      });
    });

    // Sort by priority
    return categories.sort((a, b) => {
      const aPriority = this.getCategoryPriority(a.name);
      const bPriority = this.getCategoryPriority(b.name);
      return aPriority - bPriority;
    });
  }

  /**
   * Determine component category based on widget type and properties
   */
  private determineComponentCategory(widget: ReusableWidget): string {
    // Primary categorization by widget type
    switch (widget.type) {
      case WidgetType.BUTTON:
      case WidgetType.CUPERTINO_BUTTON:
        return 'Buttons';
      
      case WidgetType.TEXT:
        return 'Typography';
      
      case WidgetType.CARD:
        return 'Surfaces';
      
      case WidgetType.CONTAINER:
        return this.categorizeContainer(widget);
      
      case WidgetType.ROW:
      case WidgetType.COLUMN:
      case WidgetType.STACK:
        return 'Layout';
      
      case WidgetType.IMAGE:
        return 'Media';
      
      case WidgetType.SCAFFOLD:
      case WidgetType.APP_BAR:
      case WidgetType.CUPERTINO_NAV_BAR:
        return 'Navigation';
      
      default:
        return 'Components';
    }
  }

  /**
   * Categorize Container widgets based on their usage
   */
  private categorizeContainer(widget: ReusableWidget): string {
    // Analyze properties to determine container purpose
    const props = widget.properties;
    
    if (props.decoration || widget.styling.borders || widget.styling.colors.length > 0) {
      return 'Surfaces';
    }
    
    if (props.padding || props.margin || widget.layout) {
      return 'Layout';
    }
    
    return 'Components';
  }

  /**
   * Determine component group within a category
   */
  private determineComponentGroup(component: FigmaComponentSpec): string {
    const name = component.name.toLowerCase();
    
    // Button grouping
    if (name.includes('button')) {
      if (name.includes('primary')) return 'Primary Buttons';
      if (name.includes('secondary')) return 'Secondary Buttons';
      if (name.includes('icon')) return 'Icon Buttons';
      return 'Buttons';
    }
    
    // Text grouping
    if (name.includes('text') || name.includes('label')) {
      if (name.includes('heading') || name.includes('title')) return 'Headings';
      if (name.includes('body') || name.includes('paragraph')) return 'Body Text';
      return 'Text';
    }
    
    // Card grouping
    if (name.includes('card')) {
      if (name.includes('elevated')) return 'Elevated Cards';
      if (name.includes('outlined')) return 'Outlined Cards';
      return 'Cards';
    }
    
    // Default grouping by component type
    return this.extractComponentType(component.name);
  }

  /**
   * Extract component type from name
   */
  private extractComponentType(name: string): string {
    const words = name.split(/[\s\/]+/);
    return words[0] || 'Components';
  }

  /**
   * Create sub-groups within a component group
   */
  private createSubGroups(components: FigmaComponentSpec[]): ComponentSubGroup[] {
    const subGroups: ComponentSubGroup[] = [];
    
    // Group by variant count
    const withVariants = components.filter(c => c.variants && c.variants.length > 1);
    const withoutVariants = components.filter(c => !c.variants || c.variants.length <= 1);
    
    if (withVariants.length > 0) {
      subGroups.push({
        name: 'With Variants',
        components: withVariants
      });
    }
    
    if (withoutVariants.length > 0) {
      subGroups.push({
        name: 'Simple Components',
        components: withoutVariants
      });
    }
    
    return subGroups;
  }

  /**
   * Generate detailed component description
   */
  private generateDetailedDescription(
    component: FigmaComponentSpec, 
    reusableWidget: ReusableWidget
  ): string {
    const parts = [
      `${component.name} component generated from ${reusableWidget.type} widget.`,
      `Used ${reusableWidget.usageCount} times in the codebase.`
    ];

    // Add variant information
    if (component.variants && component.variants.length > 1) {
      parts.push(`Available in ${component.variants.length} variants.`);
    }

    // Add property information
    if (component.properties && component.properties.length > 0) {
      parts.push(`Configurable with ${component.properties.length} properties.`);
    }

    // Add complexity assessment
    const complexity = this.assessComponentComplexity(reusableWidget);
    parts.push(`Complexity: ${complexity}.`);

    return parts.join(' ');
  }

  /**
   * Generate component tags for better searchability
   */
  private generateComponentTags(widget: ReusableWidget): string[] {
    const tags: string[] = [];
    
    // Add type-based tags
    tags.push(widget.type.toLowerCase());
    
    // Add property-based tags
    if (widget.properties.disabled !== undefined) tags.push('interactive');
    if (widget.styling.colors.length > 0) tags.push('colored');
    if (widget.children.length > 0) tags.push('container');
    if (widget.layout) tags.push('layout');
    
    // Add usage-based tags
    if (widget.usageCount > 10) tags.push('frequently-used');
    if (widget.variants.length > 0) tags.push('variants');
    
    return tags;
  }

  /**
   * Assess component complexity
   */
  private assessComponentComplexity(widget: ReusableWidget): 'Simple' | 'Medium' | 'Complex' {
    let score = 0;
    
    // Factor in children count
    score += widget.children.length;
    
    // Factor in properties count
    score += Object.keys(widget.properties).length;
    
    // Factor in variants count
    score += widget.variants.length * 2;
    
    // Factor in styling complexity
    score += widget.styling.colors.length;
    if (widget.styling.borders) score += 2;
    if (widget.styling.shadows) score += widget.styling.shadows.length;
    
    if (score <= 3) return 'Simple';
    if (score <= 8) return 'Medium';
    return 'Complex';
  }

  /**
   * Generate usage examples for components
   */
  private generateUsageExamples(widget: ReusableWidget): string[] {
    const examples: string[] = [];
    
    // Generate basic usage example
    examples.push(`Basic usage: <${widget.name} />`);
    
    // Generate examples with variants
    widget.variants.forEach(variant => {
      const props = Object.entries(variant.properties)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
      examples.push(`${variant.name}: <${widget.name} ${props} />`);
    });
    
    return examples.slice(0, 3); // Limit to 3 examples
  }

  /**
   * Generate category description
   */
  private generateCategoryDescription(categoryName: string): string {
    const descriptions: Record<string, string> = {
      'Buttons': 'Interactive button components for user actions',
      'Typography': 'Text components for content display',
      'Surfaces': 'Container components that provide visual surfaces',
      'Layout': 'Components for organizing and structuring content',
      'Media': 'Components for displaying images and media content',
      'Navigation': 'Components for app navigation and structure',
      'Components': 'General purpose components'
    };
    
    return descriptions[categoryName] || `${categoryName} components`;
  }

  /**
   * Generate group description
   */
  private generateGroupDescription(groupName: string, components: FigmaComponentSpec[]): string {
    return `${groupName} group containing ${components.length} component${components.length === 1 ? '' : 's'}`;
  }

  /**
   * Get category priority for sorting
   */
  private getCategoryPriority(categoryName: string): number {
    const priorities: Record<string, number> = {
      'Buttons': 1,
      'Typography': 2,
      'Surfaces': 3,
      'Layout': 4,
      'Navigation': 5,
      'Media': 6,
      'Components': 7
    };
    
    return priorities[categoryName] || 99;
  }

  /**
   * Get category icon
   */
  private getCategoryIcon(categoryName: string): string {
    const icons: Record<string, string> = {
      'Buttons': '🔘',
      'Typography': '📝',
      'Surfaces': '📄',
      'Layout': '📐',
      'Navigation': '🧭',
      'Media': '🖼️',
      'Components': '🧩'
    };
    
    return icons[categoryName] || '📦';
  }

  /**
   * Sort groups by priority
   */
  private sortGroupsByPriority(groups: ComponentGroup[]): ComponentGroup[] {
    return groups.sort((a, b) => {
      // Primary buttons first, then secondary, then others
      if (a.name.includes('Primary')) return -1;
      if (b.name.includes('Primary')) return 1;
      if (a.name.includes('Secondary')) return -1;
      if (b.name.includes('Secondary')) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Calculate average usage across widgets
   */
  private calculateAverageUsage(widgets: ReusableWidget[]): number {
    if (widgets.length === 0) return 0;
    const total = widgets.reduce((sum, widget) => sum + widget.usageCount, 0);
    return Math.round(total / widgets.length);
  }

  /**
   * Assess category complexity
   */
  private assessCategoryComplexity(widgets: ReusableWidget[]): 'Simple' | 'Medium' | 'Complex' {
    const complexities = widgets.map(w => this.assessComponentComplexity(w));
    const complexCount = complexities.filter(c => c === 'Complex').length;
    const mediumCount = complexities.filter(c => c === 'Medium').length;
    
    if (complexCount > widgets.length / 2) return 'Complex';
    if (mediumCount + complexCount > widgets.length / 2) return 'Medium';
    return 'Simple';
  }

  /**
   * Create page sections for a category
   */
  private createPageSections(category: ComponentCategory): LibraryPageSection[] {
    const sections: LibraryPageSection[] = [];
    
    // Create sections for each group
    category.groups.forEach(group => {
      sections.push({
        name: group.name,
        description: group.description,
        components: group.components
      });
    });
    
    return sections;
  }

  /**
   * Create cover page for the library
   */
  private createCoverPage(library: ComponentLibrary): LibraryCoverPage {
    return {
      title: library.name,
      description: library.description,
      stats: {
        totalComponents: library.metadata.totalComponents,
        totalCategories: library.categories.length,
        version: library.metadata.version
      },
      quickLinks: library.categories.map(cat => ({
        name: cat.name,
        description: cat.description,
        componentCount: cat.metadata.componentCount
      }))
    };
  }
}

// Type definitions for component organization

export interface ComponentLibrary {
  name: string;
  description: string;
  categories: ComponentCategory[];
  metadata: {
    totalComponents: number;
    generatedAt: string;
    version: string;
  };
}

export interface ComponentCategory {
  name: string;
  description: string;
  components: FigmaComponentSpec[];
  groups: ComponentGroup[];
  metadata: {
    componentCount: number;
    averageUsage: number;
    complexity: 'Simple' | 'Medium' | 'Complex';
  };
}

export interface ComponentGroup {
  name: string;
  description: string;
  components: FigmaComponentSpec[];
  subGroups: ComponentSubGroup[];
}

export interface ComponentSubGroup {
  name: string;
  components: FigmaComponentSpec[];
}

export interface LibraryPageStructure {
  name: string;
  pages: LibraryPage[];
  coverPage: LibraryCoverPage;
}

export interface LibraryPage {
  name: string;
  description: string;
  sections: LibraryPageSection[];
}

export interface LibraryPageSection {
  name: string;
  description: string;
  components: FigmaComponentSpec[];
}

export interface LibraryCoverPage {
  title: string;
  description: string;
  stats: {
    totalComponents: number;
    totalCategories: number;
    version: string;
  };
  quickLinks: {
    name: string;
    description: string;
    componentCount: number;
  }[];
}

interface ComponentCategoryData {
  components: FigmaComponentSpec[];
  widgets: ReusableWidget[];
  priority: number;
}