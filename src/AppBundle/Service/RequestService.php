<?php
namespace AppBundle\Service;
use Symfony\Component\DependencyInjection\Container;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * class: RequestService
 * -----------------------------------------------------
 * Created by MihailShirnin on 31.08.2016.
 * @package AppBundle\Service
 */

class RequestService 
{
	protected $request;
	protected $container;

	public function __construct(Container $container)
	{

		$this->container = $container;
		$this->request = $container->get('request_stack');
	}

	/**
	 * @return Request
	 */
	public function getRequest()
	{
		return $this->request->getCurrentRequest();
	}
}

