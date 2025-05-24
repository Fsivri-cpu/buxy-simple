// Custom type declarations for React
declare module 'react' {
  // Common React exports
  export type ReactNode = 
    | string
    | number
    | boolean
    | null
    | undefined
    | React.ReactElement
    | React.ReactFragment
    | React.ReactPortal;
  
  export type FC<P = {}> = React.FunctionComponent<P>;
  export type FunctionComponent<P = {}> = (props: P & { children?: ReactNode }) => React.ReactElement | null;
  
  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: ReadonlyArray<any>): void;
  export function useContext<T>(context: React.Context<T>): T;
  export function createContext<T>(defaultValue: T): React.Context<T>;
  
  export interface Context<T> {
    Provider: Provider<T>;
    Consumer: Consumer<T>;
    displayName?: string;
  }
  
  export type Provider<T> = React.ProviderExoticComponent<{
    value: T;
    children?: ReactNode;
  }>;
  
  export type Consumer<T> = React.ExoticComponent<{
    children: (value: T) => ReactNode;
  }>;
  
  export interface ProviderExoticComponent<P = {}> extends React.ExoticComponent<P> {
    propTypes?: any;
  }
  
  export interface ExoticComponent<P = {}> {
    (props: P): React.ReactElement | null;
    readonly $$typeof: symbol;
  }
  
  export interface ReactElement<P = any, T extends string | React.JSXElementConstructor<any> = string | React.JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: React.Key | null;
  }
  
  export type JSXElementConstructor<P> = 
    | ((props: P) => React.ReactElement | null)
    | (new (props: P) => React.Component<P, any>);
  
  export type Key = string | number;
  
  export type ReactFragment = {} | Iterable<ReactNode>;
  export interface ReactPortal extends ReactElement {
    key: Key | null;
    children: ReactNode;
  }
}

// Add JSX Runtime support
declare module 'react/jsx-runtime' {
  export namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
  
  export function jsx(type: any, props: any, key?: string): any;
  export function jsxs(type: any, props: any, key?: string): any;
  export const Fragment: unique symbol;
}

// Custom type declarations for React Native
declare module 'react-native' {
  export const View: React.FC<ViewProps>;
  export const Text: React.FC<TextProps>;
  export const ActivityIndicator: React.FC<ActivityIndicatorProps>;
  export const ScrollView: React.FC<ScrollViewProps>;
  export const TouchableOpacity: React.FC<TouchableOpacityProps>;
  
  export interface ViewProps {
    style?: any;
    children?: React.ReactNode;
    [key: string]: any;
  }
  
  export interface TextProps {
    style?: any;
    children?: React.ReactNode;
    [key: string]: any;
  }
  
  export interface ActivityIndicatorProps {
    size?: 'small' | 'large' | number;
    color?: string;
    animating?: boolean;
    [key: string]: any;
  }
  
  export interface ScrollViewProps extends ViewProps {
    contentContainerStyle?: any;
    horizontal?: boolean;
    showsHorizontalScrollIndicator?: boolean;
    showsVerticalScrollIndicator?: boolean;
    [key: string]: any;
  }
  
  export interface TouchableOpacityProps extends ViewProps {
    onPress?: () => void;
    activeOpacity?: number;
    [key: string]: any;
  }
}
