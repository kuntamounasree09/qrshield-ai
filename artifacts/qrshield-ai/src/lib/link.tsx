import { Link as RouterLink, type LinkProps } from 'react-router-dom';

type AppLinkProps = Omit<LinkProps, 'to'> & {
  href?: string;
  to?: string;
};

export function Link({ href, to, ...props }: AppLinkProps) {
  return <RouterLink to={to ?? href ?? '/'} {...props} />;
}