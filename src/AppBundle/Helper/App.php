<?php
namespace AppBundle\Helper;

/*
 * class: Help
 * -----------------------------------------------------
 * Класс хелпера, для упрошенного обращения в методам и функциям.
 * @package AppBundle\Helper
 */
use AppBundle\AppBundle;
use AppBundle\Entity\UserEntity;
use Doctrine\Bundle\DoctrineBundle\Registry;
use Doctrine\Common\Persistence\ObjectRepository;
use Doctrine\ORM\EntityManager;
use Memcache;
use Monolog\Logger;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\Routing\Router;
use Symfony\Component\Translation\LoggingTranslator;
use Symfony\Component\VarDumper\VarDumper;

class App {

	private static $aLocalesCode = [];
	private static $aLocalesCodeFull = [];
	private static $aLocales = [];
	private static $oContainer;
	private static $oDoctrine;
	private static $oEntityManager;
	private static $oRequest;
	private static $oSession;
	private static $oTtranslator;
	private static $sCurLocale;
	private static $oLogger;
	private static $oRouter;
	private static $oMemcache;
	private static $aMemcacheDump = [];
	private static $aListRoles = [];
    private static $oCurUser;

	/**
	 * Хелпер Дамепра от Symfony, передавать можно любое количество парметров
	 * @param $params
	 */
	public static function dump(...$params)
	{
		$params = (count($params) <= 1) ? $params[0] : $params;
		if (!RequestCm::isAjax()) {
			VarDumper::dump($params);
		}


	}
	public static function dumpAjax(...$params)
	{
		$params = (count($params) <= 1) ? $params[0] : $params;
		VarDumper::dump($params);
	}

	/**
	 * Хелпер Дамепра от Symfony, передавать можно любое количество парметров
	 * Оборнут в exit , для остановки дальнейшего вывода кода
	 * @param $params
	 */
	public static function dumpExit(...$params)
	{
		$params = (count($params) == 1) ? $params[0] : $params;
		if (!RequestCm::isAjax()) {
			VarDumper::dump($params);
			exit();
		}

	}

	/**
	 * @param $params
	 */
	public static function debug(...$params)
	{
		$params = (count($params) == 1) ? $params[0] : $params;
		echo '<pre>';
		print_r($params);
		echo '</pre>';
	}
	/**
	 * @param $params
	 */
	public static function debugExit(...$params)
	{
		$params = (count($params) == 1) ? $params[0] : $params;
		echo '<pre>';
		print_r($params);
		exit('</pre>');
	}


	/**
	 * Получение списка локалей код => название
	 * @param string $locale
	 *
	 * @return array
	 */
	public static function getLocales($locale = 'en')
	{
		if (!static::$aLocales) {
			foreach (static::getLocalesCode() as $code) {
				static::$aLocales[$code] = static::getTtranslator()->trans('locales.' . $code , [], null, $locale);
			}
		}

		return static::$aLocales;
	}

	/**
	 * Получаем список доступных локалей
	 *
	 * @param bool $full
	 *
	 * @return array
	 */

	public static function getLocalesCode($full = false)
	{
		if (!static::$aLocalesCode) {
			$aLocales2 = AppBundle::getContainer()->getParameter('available_langs');
			static::$aLocalesCode = explode('|', $aLocales2);
		}

		if ($full) {
			if (!static::$aLocalesCodeFull) {
				static::$aLocalesCodeFull = static::$aLocalesCode;
				if (!in_array('ru', static::$aLocalesCodeFull)) {
					array_unshift(static::$aLocalesCodeFull, "ru");
				}
			}
		}

		return $full ? static::$aLocalesCodeFull : static::$aLocalesCode;
	}

	/**
	 * @return ContainerInterface
	 */
	public static function getContainer()
	{
		if (!static::$oContainer) {
			static::$oContainer = AppBundle::getContainer();
		}

		return static::$oContainer;
	}

	/**
	 * Получение списка ролей
	 * @return array
	 */
	public static function getListRoles()
	{
		if (!static::$aListRoles) {
			static::$aListRoles = static::getContainer()->getParameter('security.role_hierarchy.roles');
		}

		return static::$aListRoles;
	}

	/**
	 * @return Registry | mixed
	 */
	public static function getDoctrine()
	{
		if (!static::$oDoctrine) {
			if (! static::getContainer()->has('doctrine')) {
				throw new \LogicException('The DoctrineBundle is not registered in your application.');
			}
			static::$oDoctrine = static::getContainer()->get('doctrine');
		}
		return static::$oDoctrine;
	}

	/**
	 * @param $name 'AppBundle:......'
	 *
	 * @return ObjectRepository
	 */
	public static function getRepository($name)
	{
		return static::getDoctrine()->getRepository($name);
	}

	/**
	 * @return EntityManager
	 */
	public static function em()
	{
		if (!static::$oEntityManager) {
			static::$oEntityManager = static::getDoctrine()->getManager();
		}
		return static::$oEntityManager;
	}

	/**
	 * @return Request
	 */
	public static function getRequest()
	{
		if (!static::$oRequest) {
			static::$oRequest = static::getContainer()->get('request_stack')->getCurrentRequest();
		}
		return static::$oRequest;
	}

	/**
	 * @return Session
	 */
	public static function getSession()
	{
		if (!static::$oSession) {
			static::$oSession = static::getContainer()->get('session');
		}
		return static::$oSession;
	}

	/**
	 * @return LoggingTranslator
	 */
	public static function getTtranslator()
	{
		if (!static::$oTtranslator) {
			static::$oTtranslator = static::getContainer()->get('translator');
		}
		return static::$oTtranslator;
	}

	/**
	 * Текущая локаль юзера
	 * @return string
	 */
	public static function getCurLocale()
	{
		if (!static::$sCurLocale) {
			static::$sCurLocale = static::getRequest()->getLocale() ? static::getRequest()->getLocale()  : 'en';
		}
		return static::$sCurLocale;
	}

	/**
	 * Проверяем на наличие DEV окружения
	 * @return bool
	 */
	public static function isDev()
	{
		$env = static::getContainer()->get('kernel')->getEnvironment();
		return $env == 'dev';
	}

	/**
	 * @return Logger
	 */
	public static function getLogger()
	{
		if (!static::$oLogger) {
			static::$oLogger = static::getContainer()->get('logger');
		}
		return static::$oLogger;
	}

	/**
	 * @return Router
	 */
	public static function getRouter()
	{
		if (!static::$oRouter) {
			static::$oRouter = static::getContainer()->get('router');
		}
		return static::$oRouter;
	}

	/**
	 * Получение имени своего домена без лишних данных из конфига.
	 * @return mixed|string
	 */
	public static function getDomain()
	{
		$domain = static::getContainer()->getParameter('domain');
		$domain = trim($domain, '.');
		$domain = trim($domain);
		return $domain;
	}

	/**
	 * получение списка существующих роутеров
	 * @param $params
	 *
	 * @return array
	 */
	public static function getListRoute($params = null)
	{
		$params = is_array($params) ? $params : [$params => $params];
		$allRoutes = static::getRouter()->getRouteCollection()->all();
		$routes = [];
		/** @var $items \Symfony\Component\Routing\Route */
		foreach ($allRoutes as $route => $items) {
			$defaults = $items->getDefaults();
			if (isset($defaults['_controller'])) {
				if (strripos($defaults['_controller'], 'WebBundle') !== false) {
					$routes[$route] = $items;
				}
			}
		}

		if (isset($params['admin']) or isset($params['sonata_admin'])) {
			foreach ($routes as $route => $items) {
				$defaults = $items->getDefaults();
				if (empty($defaults['_sonata_admin'])) {
					unset($routes[$route]);
				}
			}
		}

		return $routes;
	}

	/**
	 * @return Memcache
	 */
	public static function getMemcache()
	{
		if (!static::$oMemcache) {
			$memcache = new Memcache;
			$memcache->connect('localhost', 11211);
			static::$oMemcache = $memcache;
		}
		return static::$oMemcache;
	}

	/**
	 * Удаляем значения из мемкеша
	 * @param null $name Если значение не указано, то будет очищен весь кеш
	 * todo сделать проверку на версию. с 2,0 функции статические будут
	 */
	public static function clearValMemcache($name = null)
	{
		$memcache = static::getMemcache();

		if (count(static::$aMemcacheDump) < 1) {
			$allSlabs = $memcache->getExtendedStats('slabs');
			foreach ($allSlabs as $server => $slabs) {
				foreach ($slabs AS $slabId => $slabMeta) {
					if (is_integer($slabId)) {
						$cdump = $memcache->getExtendedStats('cachedump', (int) $slabId);
						foreach ($cdump AS $keys => $arrVal) {
							if (!is_array($arrVal))
								continue;
							static::$aMemcacheDump[] = $arrVal;
						}
					}
				}
			}
		}

		foreach (static::$aMemcacheDump AS $keys => $arrVal) {
			foreach ($arrVal as $k => $v) {
				if ($name) {
					if (stripos($k, $name) !== false) {
						$memcache->delete($k);
					}
				} else {
					$memcache->delete($k);
				}

			}
		}
	}

	/**
	 * Получаем чистое имя класса без неймспейсов
	 * @param $obj
	 * @return null|string
	 */
	public static function getClassName($obj)
	{
		if (is_object($obj)) {
			$aName = explode('\\', get_class($obj));
			return $aName[count($aName)-1];
		}
		return null;
	}

	/**
	 * Проверяем наличие текста в строке
	 * @param $str
	 * @param $search
	 *
	 * @return bool
	 */
	public static function isInStr($str, $search)
	{
		$pos = strripos($str, $search);
		return $pos !== false;
	}

    /**
     * @return mixed|UserEntity
     */
    public static function getCurUser()
    {
        if (!static::$oCurUser) {
            static::$oCurUser = static::getContainer()->get('security.token_storage')->getToken()->getUser();
        }
        return static::$oCurUser;
    }

}

